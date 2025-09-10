import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';

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

let db: Firestore | null = null;
let persistenceEnabled = false;

export const getDb = async (): Promise<Firestore> => {
    if (db) return db;

    db = getFirestore(app);

    if (typeof window !== 'undefined' && !persistenceEnabled) {
        persistenceEnabled = true;
        try {
            await enableIndexedDbPersistence(db);
        } catch (err: any) {
            if (err.code === 'failed-precondition') {
                console.warn("Firestore persistence failed: Multiple tabs open.");
            } else if (err.code === 'unimplemented') {
                console.warn("Firestore persistence failed: Browser does not support all features.");
            } else {
                console.error("Firestore persistence error:", err);
            }
        }
    }
    return db;
};


export { app, auth };
