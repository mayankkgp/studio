import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "placeholder-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "placeholder-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "placeholder-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "placeholder-sender",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "placeholder-app"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with settings
// experimentalForceLongPolling: true is critical for stability in cloud IDE environments
let db: any;
const firestoreSettings = {
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true
};

// Ensure settings are applied by using initializeFirestore if no instance exists
try {
    if (getApps().length === 1) {
        db = initializeFirestore(app, firestoreSettings);
    } else {
        db = getFirestore(app);
    }
} catch (e) {
    db = getFirestore(app);
}

export { db };
