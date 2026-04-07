import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;
let adminAuth: Auth;
let adminDb: Firestore;

export function getAdminApp() {
  if (!app) {
    if (!getApps().length) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "care-14c31",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        }),
      });
    } else {
      app = getApps()[0];
    }
  }
  return app;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    getAdminApp();
    adminAuth = getAuth();
  }
  return adminAuth;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    getAdminApp();
    adminDb = getFirestore();
  }
  return adminDb;
}
