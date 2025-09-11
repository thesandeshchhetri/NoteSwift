'use server';
/**
 * @fileOverview A flow to delete a user and all their associated data.
 *
 * - deleteUser - A function that handles deleting a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { doc, collection, query, where, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { DeleteUserInputSchema, type DeleteUserInput } from '@/types/schemas';
import {NextRequest} from 'next/server';

export async function deleteUser(input: DeleteUserInput): Promise<void> {
  return deleteUserFlow(input);
}

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
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
  async ({ uid }) => {
    await initFirebaseAdmin();
    const auth = getAuth();
    const db = await getDb();
    
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
    await deleteDoc(userDocRef);

    // 3. Delete the user from Firebase Auth
    await auth.deleteUser(uid);
  }
);
