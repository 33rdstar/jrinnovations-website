const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");

initializeApp();

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
