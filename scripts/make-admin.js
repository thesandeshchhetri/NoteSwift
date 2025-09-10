// This script assigns the 'superadmin' custom claim to a user.
// Custom claims are a secure way to implement role-based access control with Firebase.
// To run it, you need to have Node.js and Firebase Admin SDK configured.

// Usage: node scripts/make-admin.js <user_email>

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

// Check if the service account key file exists and provide a helpful error message if not.
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`
Error: Service account key file not found.
Please download your Firebase project's service account key, rename it to 'serviceAccountKey.json', and place it in the 'scripts' directory.

You can generate a new private key in your Firebase project settings:
Project Settings > Service accounts > Generate new private key.
`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Please provide a user email as an argument.');
  process.exit(1);
}

async function makeAdmin(email) {
  try {
    // Get the user by email from Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    // Set the custom claim { superadmin: true } on the user account
    await auth.setCustomUserClaims(uid, { superadmin: true });
    
    console.log(`Successfully assigned 'superadmin' custom claim to ${email} (UID: ${uid})`);
    console.log('Please log out and log back in for the changes to take effect.');

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
        console.error(`
Error: No user record found for the email "${email}".
Please make sure you are using the email address you used to sign up for the application.
This is your personal user account email, not the service account email.
`);
    } else {
        console.error('Error assigning admin role:', error.message);
        console.error('Full error object:', error);
    }
    process.exit(1);
  }
}

makeAdmin(userEmail);
