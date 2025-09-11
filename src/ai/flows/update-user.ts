'use server';
/**
 * @fileOverview A flow to update user details.
 *
 * - updateUser - A function that handles updating a user's username.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { doc, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { UpdateUserInputSchema, type UpdateUserInput } from '@/types/schemas';
import { NextRequest } from 'next/server';

export async function updateUser(input: UpdateUserInput): Promise<void> {
  return updateUserFlow(input);
}

const updateUserFlow = ai.defineFlow(
  {
    name: 'updateUserFlow',
    inputSchema: UpdateUserInputSchema,
    outputSchema: z.void(),
    auth: async (auth, input) => {
        const req = auth as NextRequest;
        const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!idToken) {
            throw new Error('Unauthorized: No token provided.');
        }
        
        await initFirebaseAdmin();
        const decodedToken = await getAuth().verifyIdToken(idToken);
        
        if (decodedToken.superadmin !== true) {
            throw new Error('Forbidden: Only superadmins can perform this action.');
        }
    },
  },
  async ({ uid, username }) => {
    await initFirebaseAdmin();
    const auth = getAuth();
    const db = await getDb();

    const userDocRef = doc(db, 'users', uid);
    const userDocSnapshot = await getDoc(userDocRef);
    if (!userDocSnapshot.exists()) {
        throw new Error('User not found.');
    }
    const currentUsername = userDocSnapshot.data().username;

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
