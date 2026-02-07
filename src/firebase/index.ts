
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Long polling is critical for stability in cloud-based preview environments.
    // ignoreUndefinedProperties: true prevents crashes when saving forms with empty optional fields.
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      experimentalForceLongPolling: true,
    });
    auth = getAuth(app);
  } else {
    app = getApp();
    // We try to use the existing db if it was already initialized with settings
    try {
      db = getFirestore(app);
    } catch (e) {
      db = initializeFirestore(app, {
        ignoreUndefinedProperties: true,
        experimentalForceLongPolling: true,
      });
    }
    auth = getAuth(app);
  }
  return { app, db, auth };
}

export * from './provider';
