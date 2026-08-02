import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (prevent re-initialization in development)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth and Storage instances
export const auth = getAuth(app);
export const storage = getStorage(app);

let firestoreInstance;
const globalWithFirestore = global as typeof globalThis & {
  firestoreInstance?: any;
};

if (globalWithFirestore.firestoreInstance) {
  firestoreInstance = globalWithFirestore.firestoreInstance;
} else {
  try {
    firestoreInstance = initializeFirestore(app, { 
      experimentalForceLongPolling: true
    });
    globalWithFirestore.firestoreInstance = firestoreInstance;
    console.log("[Firebase Client] Initialized Firestore with long polling.");
  } catch (error) {
    console.warn("[Firebase Client] initializeFirestore failed, falling back to getFirestore:", error);
    firestoreInstance = getFirestore(app);
  }
}

export const db = firestoreInstance;

export {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint
};

export default app;
