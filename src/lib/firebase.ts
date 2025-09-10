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

let dbInstance: Firestore | null = null;
let persistenceEnabled = false;
let persistencePromise: Promise<void> | null = null;

const initializePersistence = async (db: Firestore) => {
    if (persistencePromise) {
        return persistencePromise;
    }
    persistencePromise = new Promise(async (resolve, reject) => {
        try {
            await enableIndexedDbPersistence(db);
            persistenceEnabled = true;
            resolve();
        } catch (err: any) {
            if (err.code == 'failed-precondition') {
                console.warn("Firestore persistence failed: Multiple tabs open. Operations will be in memory.");
                // Persistence failed, but we can continue with in-memory persistence.
                resolve(); 
            } else if (err.code == 'unimplemented') {
                console.warn("Firestore persistence failed: Browser does not support all features.");
                resolve();
            } else {
                console.error("Firestore persistence error:", err);
                reject(err);
            }
        }
    });
    return persistencePromise;
};

export const getDb = async (): Promise<Firestore> => {
    if (!dbInstance) {
        const db = getFirestore(app);
        await initializePersistence(db);
        dbInstance = db;
    } else if (!persistenceEnabled) {
        // This handles the case where getDb is called again before the first promise resolves.
        await initializePersistence(dbInstance);
    }
    return dbInstance;
};


export { app, auth };
