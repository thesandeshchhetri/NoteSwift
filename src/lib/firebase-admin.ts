'use server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import 'dotenv/config';

let app: App;

export async function initFirebaseAdmin() {
    if (getApps().length > 0) {
        app = getApps()[0];
        return app;
    }
    
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountString) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable. Make sure it is set in .env.local');
    }
    
    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        
        app = initializeApp({
            credential: cert(serviceAccount),
        });
        return app;
    } catch (e: any) {
        console.error('Failed to parse or initialize Firebase Admin SDK:', e.message);
        console.error('Check the format of your FIREBASE_SERVICE_ACCOUNT variable in .env.local');
        throw new Error('Firebase Admin SDK initialization failed. Check the format of your service account key.');
    }
}
