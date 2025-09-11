'use server';
/**
 * @fileOverview A flow for a superadmin to update a user's password.
 *
 * - updateUserPassword - A function that handles updating a user's password.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { UpdateUserPasswordInputSchema, type UpdateUserPasswordInput } from '@/types/schemas';

export async function updateUserPassword(input: UpdateUserPasswordInput): Promise<void> {
  return updateUserPasswordFlow(input);
}

const updateUserPasswordFlow = ai.defineFlow(
  {
    name: 'updateUserPasswordFlow',
    inputSchema: UpdateUserPasswordInputSchema,
    outputSchema: z.void(),
  },
  async ({ uid, newPassword }) => {
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
    
    await auth.updateUser(uid, {
      password: newPassword,
    });
  }
);
