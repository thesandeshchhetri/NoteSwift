// This script is used to assign the 'superadmin' role to a user in Firestore.
// To run it, you will need to have Node.js installed and have the Firebase Admin SDK configured.
// As this is a prototype environment, you would typically run this from your local machine with service account credentials.

// Usage: node scripts/make-admin.js <user_email>

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// IMPORTANT: Replace with your actual service account key file path
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Please provide a user email as an argument.');
  process.exit(1);
}

async function makeAdmin(email) {
  try {
    // Get the user by email from Firebase Auth to find their UID
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    // Update the user's document in the 'users' collection in Firestore
    const userRef = db.collection('users').doc(uid);
    await userRef.update({ role: 'superadmin' });
    
    console.log(`Successfully assigned 'superadmin' role to ${email} (UID: ${uid})`);
  } catch (error) {
    console.error('Error assigning admin role:', error.message);
    process.exit(1);
  }
}

makeAdmin(userEmail);
