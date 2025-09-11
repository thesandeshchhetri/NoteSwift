'use server';
/**
 * @fileOverview A flow for a superadmin to update a user's password.
 *
 * - updateUserPassword - A function that handles updating a user's password.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { UpdateUserPasswordInputSchema, type UpdateUserPasswordInput } from '@/types/schemas';
import { NextRequest } from 'next/server';

export async function updateUserPassword(input: UpdateUserPasswordInput): Promise<void> {
  return updateUserPasswordFlow(input);
}

const updateUserPasswordFlow = ai.defineFlow(
  {
    name: 'updateUserPasswordFlow',
    inputSchema: UpdateUserPasswordInputSchema,
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
  async ({ uid, newPassword }) => {
    await initFirebaseAdmin();
    const auth = getAuth();
    
    await auth.updateUser(uid, {
      password: newPassword,
    });
  }
);
