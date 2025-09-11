'use server';
/**
 * @fileOverview A flow to delete a user and all their associated data.
 *
 * - deleteUser - A function that handles deleting a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { doc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { headers } from 'next/headers';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { DeleteUserInputSchema, type DeleteUserInput } from '@/types/schemas';

async function verifySuperAdmin() {
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
}

export async function deleteUser(input: DeleteUserInput): Promise<void> {
  return deleteUserFlow(input);
}

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: z.void(),
  },
  async ({ uid }) => {
    await verifySuperAdmin();
    const db = await getDb();
    const auth = getAuth();
    
    // 1. Delete all notes for the user
    const notesRef = collection(db, 'notes');
    const notesQuery = query(notesRef, where('userId', '==', uid));
    const notesSnapshot = await getDocs(notesQuery);

    if (!notesSnapshot.empty) {
        const batch = writeBatch(db);
        notesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
    
    // 2. Delete the user document from Firestore
    const userDocRef = doc(db, 'users', uid);
    await userDocRef.delete();

    // 3. Delete the user from Firebase Auth
    await auth.deleteUser(uid);
  }
);
