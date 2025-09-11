'use server';
/**
 * @fileOverview A flow to update user details.
 *
 * - updateUser - A function that handles updating a user's username.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { headers } from 'next/headers';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { UpdateUserInputSchema, type UpdateUserInput } from '@/types/schemas';

export async function updateUser(input: UpdateUserInput): Promise<void> {
  return updateUserFlow(input);
}

const updateUserFlow = ai.defineFlow(
  {
    name: 'updateUserFlow',
    inputSchema: UpdateUserInputSchema,
    outputSchema: z.void(),
  },
  async ({ uid, username }) => {
    const headersList = headers();
    const idToken = headersList.get('Authorization')?.split('Bearer ')[1];
    
    if (!idToken) {
        throw new Error('Unauthorized: No token provided.');
    }

    await initFirebaseAdmin();
    const auth = getAuth();
    
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        if (decodedToken.superadmin !== true) {
            throw new Error('Forbidden: Only superadmins can perform this action.');
        }
    } catch (error) {
        console.error("Auth verification failed:", error);
        throw new Error('Unauthorized: Invalid token.');
    }
    
    const db = await getDb();

    const userDocRef = doc(db, 'users', uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists()) {
        throw new Error('User not found.');
    }
    const currentUsername = userDoc.data().username;

    // If username is changing, check for uniqueness
    if (username !== currentUsername) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            throw new Error('Username is already taken.');
        }
    }
    
    // Update Firebase Auth
    await auth.updateUser(uid, { displayName: username });

    // Update Firestore
    await updateDoc(userDocRef, { username });
  }
);
