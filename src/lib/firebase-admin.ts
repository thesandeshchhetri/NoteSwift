'use server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';

let app: App;
export async function initFirebaseAdmin() {
    if (getApps().length > 0) {
        app = getApps()[0];
        return;
    }
    
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!serviceAccount) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
    }
    
    app = initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
    });
}
