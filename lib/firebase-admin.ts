import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("[Firebase Admin] Successfully initialized with service account key.");
    } catch (error) {
      console.error("[Firebase Admin] Failed to parse service account key JSON:", error);
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } else {
    // If running locally without service account, log clear warning
    const isLocal = process.env.NODE_ENV !== "production" && !process.env.VERCEL;
    if (isLocal) {
      console.warn("[Firebase Admin] WARNING: Running locally without FIREBASE_SERVICE_ACCOUNT_KEY. Database Admin SDK operations will fail.");
    }
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    console.log("[Firebase Admin] Initialized using project ID fallback.");
  }
}

export const dbAdmin = getFirestore();
