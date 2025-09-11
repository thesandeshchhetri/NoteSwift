'use server';
/**
 * @fileOverview A flow to create a new user.
 *
 * - createUser - A function that handles creating a new user with a specified role.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { CreateUserInputSchema, type CreateUserInput } from '@/types/schemas';
import { NextRequest } from 'next/server';

export async function createUser(input: CreateUserInput): Promise<{ uid: string }> {
  return createUserFlow(input);
}

const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: z.object({ uid: z.string() }),
    auth: async (auth, input) => {
        const req = auth as NextRequest;
        const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
        
        if (!idToken) {
            throw new Error('Unauthorized: No token provided.');
        }

        await initFirebaseAdmin();
        const authClient = getAuth();
        
        const decodedToken = await authClient.verifyIdToken(idToken);
        const isSuperAdmin = decodedToken.superadmin === true;
        const isAdmin = decodedToken.role === 'admin';

        if (!isSuperAdmin && !isAdmin) {
            throw new Error('Forbidden: Only admins or superadmins can create users.');
        }
    },
  },
  async input => {
    await initFirebaseAdmin();
    const auth = getAuth();
    const db = await getDb();

    // Check for unique username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', input.username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error('Username is already taken.');
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.username,
    });

    // Set custom claims for the role
    await auth.setCustomUserClaims(userRecord.uid, { role: input.role });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userRecord.uid), {
      username: input.username,
      email: input.email,
      role: input.role,
    });

    return { uid: userRecord.uid };
  }
);
