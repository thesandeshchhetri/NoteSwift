// This script is used to assign the 'superadmin' role to a user in Firestore.
// To run it, you will need to have Node.js installed and have the Firebase Admin SDK configured.
// As this is a prototype environment, you would typically run this from your local machine with service account credentials.

// Usage: node scripts/make-admin.js <user_email>

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`
Error: Service account key file not found.
Please download your Firebase project's service account key, rename it to 'serviceAccountKey.json', and place it in the 'scripts' directory.

You can generate a service account key in your Firebase project settings:
Project Settings > Service accounts > Generate new private key.
`);
  process.exit(1);
}

// IMPORTANT: Replace with your actual service account key file path
const serviceAccount = require(serviceAccountPath);

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
    if (error.code === 'auth/user-not-found') {
        console.error(`
Error: No user record found for the email "${email}".
Please make sure you are using the email address you used to sign up for the application, not the service account email.
`);
    } else {
        console.error('Error assigning admin role:', error.message);
    }
    process.exit(1);
  }
}

makeAdmin(userEmail);
