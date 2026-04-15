import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    // Attempt to initialize using GOOGLE_APPLICATION_CREDENTIALS environment variable
    // For local dev, point this env var to your downloaded service account JSON file.
    // E.g., process.env.GOOGLE_APPLICATION_CREDENTIALS = "path/to/service-account.json"
    
    // As an alternative, if you have stringified the JSON into a single environment variable:
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountString) {
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback to default application credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
    
    console.log("Firebase Admin Initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin Initialization Error", error);
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminMessaging = admin.messaging();

export { adminDb, adminAuth, adminMessaging };
