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
import { headers } from 'next/headers';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { CreateUserInputSchema, type CreateUserInput } from '@/types/schemas';

export async function createUser(input: CreateUserInput): Promise<{ uid: string }> {
  return createUserFlow(input);
}

const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: z.object({ uid: z.string() }),
  },
  async input => {
    // Authorization check moved inside the flow
    const headersList = headers();
    const idToken = headersList.get('Authorization')?.split('Bearer ')[1];
    
    if (!idToken) {
        throw new Error('Unauthorized: No token provided.');
    }

    await initFirebaseAdmin();
    const auth = getAuth();
    
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const isSuperAdmin = decodedToken.superadmin === true;
        const isAdmin = decodedToken.role === 'admin';

        if (!isSuperAdmin && !isAdmin) {
            throw new Error('Forbidden: Only admins or superadmins can create users.');
        }
    } catch (error) {
        console.error("Auth verification failed:", error);
        throw new Error('Unauthorized: Invalid token.');
    }

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
