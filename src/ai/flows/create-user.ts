'use server';
/**
 * @fileOverview A flow to create a new user.
 *
 * - createUser - A function that handles creating a new user with a specified role.
 * - CreateUserInput - The input type for the createUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { NextRequest } from 'next/server';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

export const CreateUserInputSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'user']).describe("The role to assign to the new user."),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

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
            throw new Error('Unauthorized');
        }
        
        await initFirebaseAdmin();
        const decodedToken = await getAuth().verifyIdToken(idToken);
        
        // Superadmins and admins should be able to create users.
        // The custom claim is 'role', not 'superadmin'.
        if (decodedToken.role !== 'superadmin' && decodedToken.role !== 'admin') {
            throw new Error('Only admins or superadmins can create users.');
        }
    },
  },
  async input => {
    await initFirebaseAdmin();
    const auth = getAuth();
    const db = await getDb();

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
