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
let persistencePromise: Promise<void> | null = null;

const initializePersistence = async (db: Firestore) => {
    if (typeof window === 'undefined') {
        // We are on the server, don't try to enable persistence.
        return Promise.resolve();
    }

    if (persistencePromise) {
        return persistencePromise;
    }

    persistencePromise = new Promise(async (resolve, reject) => {
        try {
            await enableIndexedDbPersistence(db);
            resolve();
        } catch (err: any) {
            if (err.code == 'failed-precondition') {
                console.warn("Firestore persistence failed: Multiple tabs open. Operations will be in memory.");
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
        dbInstance = getFirestore(app);
        await initializePersistence(dbInstance);
    } else if (!persistencePromise) {
        await initializePersistence(dbInstance);
    }
    return dbInstance;
};


export { app, auth };