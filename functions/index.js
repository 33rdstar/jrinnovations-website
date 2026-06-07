const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");

initializeApp();

/**
 * createBackOfficer
 * Called from the admin frontend to create a restricted officer account.
 *
 * What it does:
 * 1. Verifies the caller is a manager (role check in Firestore)
 * 2. Creates a Firebase Auth user with the OTP as the initial password
 * 3. Writes the user doc to /users/{uid} with role: 'officer'
 * 4. Returns the new officer's data to the client
 */
exports.createBackOfficer = onCall(async (request) => {
  const {
    name,
    email,
    phoneNumber,
    nrcNumber,
    gender,
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
  if (!callerDoc.exists || callerDoc.data().role !== "manager") {
    throw new HttpsError(
        "permission-denied",
        "Only managers can create officers.",
    );
  }

  // ── Validation ────────────────────────────────────────────────
  if (!name || !email || !phoneNumber || !nrcNumber || !otp) {
    throw new HttpsError(
        "invalid-argument",
        "Missing required fields.",
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
    email,
    phoneNumber,
    nrcNumber,
    gender: gender || "Prefer not to say",
    role: "officer", // Restricted role — only Listings page
    // Flipped to true on first login (see OfficerAuthGuard)
    zieaNumber: zieaNumber || null,
    hasLoggedIn: false,
    blacklisted: false,
    createdAt: new Date().toISOString(),
    createdBy: callerUid,
  };

  await db.collection("users").doc(userRecord.uid).set(officerData);

  return {officer: {id: userRecord.uid, ...officerData}};
});
