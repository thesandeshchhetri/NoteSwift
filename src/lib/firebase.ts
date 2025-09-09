import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

export const firebaseConfig = {
  "projectId": "noteswift-hs7i8",
  "appId": "1:40404564759:web:f3f3c39df75dd6c70b1552",
  "storageBucket": "noteswift-hs7i8.firebasestorage.app",
  "apiKey": "AIzaSyBTH1I435QmdOpKShTOIT6xPguxL6CI468",
  "authDomain": "noteswift-hs7i8.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "40404564759"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
(async () => {
    try {
        await enableIndexedDbPersistence(db);
    } catch (err: any) {
        if (err.code == 'failed-precondition') {
            console.error("Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.");
        } else if (err.code == 'unimplemented') {
            console.error("Firestore persistence failed: The current browser does not support all of the features required to enable persistence.");
        }
    }
})();

export { app, auth, db };
