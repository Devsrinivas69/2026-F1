// Firebase client - single source of truth for Firebase initialization
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDXXTvyTSCdbPD8WNCJVqWY3qjr6t5ktV4",
  authDomain: "f1-commander.firebaseapp.com",
  projectId: "f1-commander",
  storageBucket: "f1-commander.firebasestorage.app",
  messagingSenderId: "358371046919",
  appId: "1:358371046919:web:6e2da6f60f28320d879ca2",
  measurementId: "G-39W8QMK9ZJ",
};

// Initialize Firebase (avoid re-initializing if already done)
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let analytics: Analytics | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function firestore(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

export function firebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function firebaseAnalytics(): Analytics | null {
  if (typeof window === "undefined") return null;
  if (!analytics) {
    try {
      analytics = getAnalytics(getFirebaseApp());
    } catch {
      return null;
    }
  }
  return analytics;
}

// Export the firebase app instance
export { getFirebaseApp as firebaseApp };
