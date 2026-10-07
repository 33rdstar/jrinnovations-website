const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {randomInt, createHash} = require("crypto");

initializeApp();

// The mobile app's callable functions live in europe-west1; keep the
// password-recovery functions next to them so the app can reach both with
// one Functions instance.
const APP_REGION = "europe-west1";

// Roles allowed to create officer accounts. Using .includes() instead of
// chained !== / || comparisons avoids the bug where a role can only ever
// match ONE of several values, making an OR-of-negations always true.
// NOTE: registration_officer was intentionally removed — they may view the
// Back Officers list but must not be able to mint new officer accounts.
const ALLOWED_CREATOR_ROLES = ["admin", "manager"];

/**
 * createBackOfficer
 * Called from the admin frontend to create a restricted officer account.
 *
 * What it does:
 * 1. Verifies the caller's role is allowed to create officers (Firestore)
 * 2. Creates a Firebase Auth user with the OTP as the initial password
 * 3. Writes the user doc to /users/{uid} with the assigned role
 * 4. Returns the new officer's data to the client
 */
exports.createBackOfficer = onCall(async (request) => {
  const {
    name,
    username,
    email,
    phoneNumber,
    nrcNumber,
    gender,
    role,
    otp,
    zieaNumber,
  } = request.data;
  const callerUid = request.auth?.uid;

  // ── Auth guard ────────────────────────────────────────────────
  if (!callerUid) {
    throw new HttpsError(
        "unauthenticated",
        "You must be signed in.",
    );
  }

  const db = getFirestore();
  const callerDoc = await db.collection("users").doc(callerUid).get();
  const callerRole = callerDoc.exists ? callerDoc.data().role : null;

  if (!ALLOWED_CREATOR_ROLES.includes(callerRole)) {
    throw new HttpsError(
        "permission-denied",
        "You do not have permission to create officer accounts.",
    );
  }

  // ── Validation ────────────────────────────────────────────────
  if (!name || !username || !email || !phoneNumber || !nrcNumber ||
      !otp || !role) {
    throw new HttpsError(
        "invalid-argument",
        "Missing required fields.",
    );
  }

  // ── Username must be unique ───────────────────────────────────
  // Officers sign in with their username, so two accounts can't share one.
  const dup = await db.collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();
  if (!dup.empty) {
    throw new HttpsError(
        "already-exists",
        "That username is already taken.",
    );
  }

  // ── Create Auth user ──────────────────────────────────────────
  let userRecord;
  try {
    userRecord = await getAuth().createUser({
      email,
      password: otp, // Officer uses this OTP as their first password
      displayName: name,
    });
  } catch (err) {
    throw new HttpsError("already-exists", err.message);
  }

  // ── Write Firestore doc ───────────────────────────────────────
  const officerData = {
    name,
    username,
    email,
    phoneNumber,
    nrcNumber,
    gender: gender || "Prefer not to say",
    role: role, // Restricted role — only Listings page
    zieaNumber: zieaNumber || null,
    hasLoggedIn: false,
    resetPassword: true, // Forces the reset-password screen on first login
    blacklisted: false,
    createdAt: new Date().toISOString(),
    createdBy: callerUid,
  };

  await db.collection("users").doc(userRecord.uid).set(officerData);

  return {officer: {id: userRecord.uid, ...officerData}};
});

// ════════════════════════════════════════════════════════════════════
// Password recovery for mobile-app users
//
// App accounts sign in with a made-up address (username@placeholder), so
// Firebase's "send reset email" can't reach anyone. Instead:
//   1. requestPasswordReset  – the signed-out user submits phone + NRC +
//      name; a support ticket is opened for staff, flagged with whether
//      each detail matched the account.
//   2. adminResetUserPassword – staff verify the user by contacting the
//      phone number ON FILE, then issue a one-time temporary password.
//      The app forces the user to choose their own on first sign-in.
// ════════════════════════════════════════════════════════════════════

// Accounts that belong to staff. Their passwords are never reset through
// this flow.
const STAFF_ROLES = [
  "admin",
  "manager",
  "registration_officer",
  "customer_care",
  "auditor",
  "officer",
];

// No 0/O, 1/l/I — the password is read out or typed from a chat message.
const PASSWORD_ALPHABET =
  "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

const generateTempPassword = () =>
  Array.from({length: 8}, () =>
    PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join("");

// Zambian numbers are stored as 10 digits starting with 0 (0971234567).
// Returns "" when the input can't be a valid number.
const normalisePhone = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "");
  let phone = digits;
  if (digits.startsWith("260")) phone = "0" + digits.slice(3);
  else if (digits.length === 9) phone = "0" + digits;
  return phone.length === 10 ? phone : "";
};

const digitsOnly = (raw) => String(raw || "").replace(/\D/g, "");

const nameTokens = (raw) =>
  String(raw || "").toLowerCase().split(/[^a-z]+/).filter(Boolean);

// Fixed-window counter kept in Firestore. Returns false once `max` calls
// have been made inside `windowMs`. Counting happens whether or not the
// phone number belongs to an account, so the limit reveals nothing.
const consumeRateLimit = async (db, key, max, windowMs) => {
  const ref = db.collection("passwordResetLimits").doc(key);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? snap.data() : null;
    if (!data || now - data.windowStart > windowMs) {
      tx.set(ref, {count: 1, windowStart: now});
      return true;
    }
    if (data.count >= max) return false;
    tx.update(ref, {count: data.count + 1});
    return true;
  });
};

// Rate-limit key for a caller's IP address, namespaced per endpoint. The IP is
// hashed so raw addresses are never stored.
const ipRateKey = (request, scope) => {
  const ip = (request.rawRequest && request.rawRequest.ip) || "unknown";
  return `ip_${scope}_` +
    createHash("sha256").update(ip).digest("hex").slice(0, 24);
};

// requestPasswordReset
// Public (no sign-in) — called from the app's "Forgot password" screen.
//
// Tells the app whether an account uses the phone number (found: false when it
// does not), so the person can correct the number. It says nothing about the name
// or NRC, which only affect the note staff see, and the per-phone and per-IP
// limits below keep it from being used to trawl for registered numbers. A ticket
// is only opened when the phone number belongs to an account.
exports.requestPasswordReset = onCall(
    {region: APP_REGION},
    async (request) => {
      const phone = normalisePhone(request.data && request.data.phoneNumber);
      const nrc = digitsOnly(request.data && request.data.nrcNumber);
      const tokens = nameTokens(request.data && request.data.fullName);

      if (!phone) {
        throw new HttpsError(
            "invalid-argument",
            "Enter a valid 10-digit phone number, e.g. 0971234567.",
        );
      }
      if (tokens.length < 2) {
        throw new HttpsError(
            "invalid-argument",
            "Enter your first and last name as registered on the account.",
        );
      }

      const db = getFirestore();

      const withinPhoneLimit = await consumeRateLimit(
          db, "phone_" + phone, 3, 24 * 60 * 60 * 1000);
      const withinIpLimit = await consumeRateLimit(
          db, ipRateKey(request, "reset"), 20, 60 * 60 * 1000);
      if (!withinPhoneLimit || !withinIpLimit) {
        throw new HttpsError(
            "resource-exhausted",
            "Too many requests. Please contact support directly.",
        );
      }

      // Older accounts may hold the number in a different format.
      const last9 = phone.slice(1);
      const found = await db.collection("users")
          .where("phoneNumber", "in",
              [phone, "+260" + last9, "260" + last9, last9])
          .limit(5)
          .get();

      const genericReply = {ok: true, found: true};
      if (found.empty) return {ok: true, found: false};

      // Score each candidate; the best match is attached to the ticket.
      const scored = found.docs.map((d) => {
        const u = d.data();
        const accountNrc = digitsOnly(u.nrcNumber);
        const accountTokens = [
          ...nameTokens(u.firstName),
          ...nameTokens(u.lastName),
        ];
        const nameMatch = accountTokens.length > 0 &&
          accountTokens.every((t) => tokens.includes(t));
        // Clients have no NRC on file, so the check doesn't apply to them.
        const nrcMatch = accountNrc ? accountNrc === nrc : null;
        return {doc: d, nameMatch, nrcMatch};
      });
      scored.sort((a, b) =>
        (b.nameMatch + (b.nrcMatch !== false)) -
        (a.nameMatch + (a.nrcMatch !== false)));
      const best = scored[0];
      const uid = best.doc.id;

      // One open request per account is enough.
      const open = await db.collection("queries")
          .where("userId", "==", uid)
          .where("type", "==", "password_reset")
          .where("status", "==", "open")
          .limit(1)
          .get();
      if (!open.empty) return genericReply;

      await db.collection("queries").add({
        userId: uid,
        type: "password_reset",
        subject: "Password reset request",
        message: "Password reset requested from the login screen. Verify " +
          "the user by contacting the phone number on file before " +
          "issuing a temporary password.",
        status: "open",
        source: "forgot_password",
        verification: {
          phoneMatch: true,
          nrcMatch: best.nrcMatch,
          nameMatch: best.nameMatch,
        },
        contextId: null,
        contextTitle: null,
        createdAt: FieldValue.serverTimestamp(),
        adminReply: null,
        repliedBy: null,
        repliedAt: null,
        resolvedAt: null,
      });

      return genericReply;
    },
);

// adminResetUserPassword
// Called from the admin portal. Sets a random temporary password on an
// app user's account, signs them out everywhere, and flags the profile so
// the app makes them choose their own password on next sign-in.
//
// Returns the temporary password once — it is never stored.
exports.adminResetUserPassword = onCall(
    {region: APP_REGION},
    async (request) => {
      const callerUid = request.auth && request.auth.uid;
      if (!callerUid) {
        throw new HttpsError("unauthenticated", "You must be signed in.");
      }

      const db = getFirestore();
      const callerDoc = await db.collection("users").doc(callerUid).get();
      const callerRole = callerDoc.exists ? callerDoc.data().role : null;
      if (!ALLOWED_CREATOR_ROLES.includes(callerRole)) {
        throw new HttpsError(
            "permission-denied",
            "You do not have permission to reset passwords.",
        );
      }

      const uid = request.data && request.data.uid;
      const ticketId = request.data && request.data.ticketId;
      if (!uid || typeof uid !== "string") {
        throw new HttpsError("invalid-argument", "Missing user id.");
      }
      if (uid === callerUid) {
        throw new HttpsError(
            "permission-denied",
            "Use the change-password option for your own account.",
        );
      }

      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found.");
      }
      const target = userSnap.data();
      if (STAFF_ROLES.includes(target.role)) {
        throw new HttpsError(
            "permission-denied",
            "Staff account passwords cannot be reset here.",
        );
      }

      const tempPassword = generateTempPassword();
      try {
        await getAuth().updateUser(uid, {password: tempPassword});
        // Ends every existing session, e.g. on a lost or borrowed phone.
        await getAuth().revokeRefreshTokens(uid);
      } catch (err) {
        if (err.code === "auth/user-not-found") {
          throw new HttpsError("not-found", "This user has no login account.");
        }
        throw new HttpsError("internal", "Could not reset the password.");
      }

      await userRef.update({
        resetPassword: true,
        passwordResetAt: FieldValue.serverTimestamp(),
        passwordResetBy: callerUid,
      });

      // Audit trail — who reset whose password, never the password itself.
      await db.collection("passwordResetLogs").add({
        targetUid: uid,
        targetUsername: target.username || null,
        resetBy: callerUid,
        ticketId: typeof ticketId === "string" ? ticketId : null,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Mark the originating ticket as being worked on.
      if (typeof ticketId === "string" && ticketId) {
        const ticketRef = db.collection("queries").doc(ticketId);
        const ticketSnap = await ticketRef.get();
        if (ticketSnap.exists && ticketSnap.data().userId === uid) {
          await ticketRef.update({
            status: "in_progress",
            resetIssuedBy: callerUid,
            resetIssuedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      return {
        tempPassword,
        phoneNumber: target.phoneNumber || null,
      };
    },
);

// ════════════════════════════════════════════════════════════════════
// Sign-in helpers
//
// Both run BEFORE the user has a session, and the Firestore rules do not
// allow signed-out reads of `users`. So the app and the portal ask these
// functions instead of querying the collection themselves.
// ════════════════════════════════════════════════════════════════════

// The app derives each account's login address from the username. The
// domain is a placeholder — it is never used to send mail.
const LOGIN_EMAIL_DOMAIN = "nyumbayanga.com";

// Roles that must be approved by an administrator before signing in.
const APP_VERIFIED_ROLES = ["property_owner", "agent"];

// Server-side twin of evaluateAccountAccess() in the app's utils.js. Keep
// the wording and rules of the two in step.
const evaluateAccountAccess = (data) => {
  if (data.blacklisted) {
    return {
      allowed: false,
      message: "This account has been suspended. " +
        "Please contact support for assistance.",
    };
  }

  if (APP_VERIFIED_ROLES.includes(data.role)) {
    if (data.verificationStatus === "pending") {
      return {
        allowed: false,
        message: "Your account is still pending verification. You will be " +
          "able to log in once an administrator approves your documents.",
      };
    }
    if (data.verificationStatus === "rejected") {
      const reason = data.rejectionReason ?
        ` Reason: ${data.rejectionReason}.` : "";
      return {
        allowed: false,
        message: `Your account verification was declined.${reason} ` +
          "Please contact support if you believe this is a mistake.",
      };
    }
  }

  return {allowed: true};
};

// checkAccountAccess
// Called by the mobile app's login screen before it signs the user in. Says
// whether the account is allowed to log in (not suspended, and approved if
// it is an owner/agent). Unknown usernames are reported as allowed, so the
// answer never confirms that an account exists.
exports.checkAccountAccess = onCall(
    {region: APP_REGION},
    async (request) => {
      const username = String((request.data && request.data.username) || "")
          .toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!username) return {allowed: true};

      const db = getFirestore();
      // Generous: many users share one mobile-carrier IP address.
      const withinLimit = await consumeRateLimit(
          db, ipRateKey(request, "access"), 120, 60 * 60 * 1000);
      if (!withinLimit) {
        throw new HttpsError(
            "resource-exhausted",
            "Too many attempts. Please try again later.",
        );
      }

      const snap = await db.collection("users")
          .where("email", "==", `${username}@${LOGIN_EMAIL_DOMAIN}`)
          .limit(1)
          .get();
      if (snap.empty) return {allowed: true};

      return evaluateAccountAccess(snap.docs[0].data());
    },
);

// resolveStaffLogin
// Called by the admin portal's login page: turns a staff username into the
// email Firebase Auth needs. Only STAFF accounts are resolved, so an app
// user's email is never handed out.
exports.resolveStaffLogin = onCall(
    {region: APP_REGION},
    async (request) => {
      const username =
        String((request.data && request.data.username) || "").trim();
      if (!username || username.length > 100) return {email: null};

      const db = getFirestore();
      const withinLimit = await consumeRateLimit(
          db, ipRateKey(request, "staff"), 60, 60 * 60 * 1000);
      if (!withinLimit) {
        throw new HttpsError(
            "resource-exhausted",
            "Too many attempts. Please try again later.",
        );
      }

      const snap = await db.collection("users")
          .where("username", "==", username)
          .limit(10)
          .get();
      const staff = snap.docs
          .map((d) => d.data())
          .find((u) => STAFF_ROLES.includes(u.role) && u.email);

      return {email: staff ? staff.email : null};
    },
);
