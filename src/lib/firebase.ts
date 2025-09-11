
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

let db: Firestore;
let persistenceEnabled = false;

// This promise will be resolved once persistence is enabled.
const persistencePromise = (async () => {
    if (typeof window !== 'undefined') {
        const firestore = getFirestore(app);
        try {
            await enableIndexedDbPersistence(firestore);
            persistenceEnabled = true;
        } catch (err: any) {
            if (err.code === 'failed-precondition') {
                // This can happen if multiple tabs are open.
                // Persistence will still work in one tab.
                console.warn('Firestore persistence failed to enable in this tab. It might be enabled in another tab.');
            } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence is not supported in this browser.');
            } else {
                console.error('An error occurred while enabling Firestore persistence:', err);
            }
        }
        return firestore;
    }
    // On the server, just return a regular Firestore instance.
    return getFirestore(app);
})();

export const getDb = async (): Promise<Firestore> => {
    if (!db) {
        db = await persistencePromise;
    }
    return db;
};


export { app, auth };
