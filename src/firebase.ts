import { getStorage } from "firebase/storage";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

/**
 * @summary Reads a required environment variable and warns if it is missing.
 * @param key - The Vite environment variable key to look up.
 */
const required = (key: string) => {
  const v = import.meta.env[key];
  if (!v) console.warn(`Missing ${key} — add it to .env for Firebase.`);
  return v ?? "";
};

export const firebaseConfig = {
  apiKey: required("VITE_FIREBASE_API_KEY"),
  authDomain: required("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: required("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: required("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: required("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: required("VITE_FIREBASE_APP_ID"),
};

console.log("Firebase App loaded", firebaseConfig);

let app: FirebaseApp | undefined;

/**
 * @summary Returns the singleton Firebase app instance, initializing it on first call.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export const auth =  getAuth(getFirebaseApp());
export const db =  getFirestore(getFirebaseApp());
export const storage = getStorage(getFirebaseApp());

let messagingInstance: Messaging | null = null;

/**
 * @summary Returns Firebase messaging when browser support is available.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(getFirebaseApp());
  }
  return messagingInstance;
}
