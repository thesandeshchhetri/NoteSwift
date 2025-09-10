'use server';
/**
 * @fileOverview A flow to manage user roles.
 *
 * - setUserRole - A function that sets a user's role via custom claims.
 * - SetUserRoleInput - The input type for the setUserRole function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import {NextRequest} from 'next/server';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

export const SetUserRoleInputSchema = z.object({
  uid: z.string().describe('The UID of the user to update.'),
  role: z.enum(['admin', 'user']).describe("The role to assign to the user."),
});
export type SetUserRoleInput = z.infer<typeof SetUserRoleInputSchema>;

export async function setUserRole(input: SetUserRoleInput): Promise<void> {
    return setUserRoleFlow(input);
}

const setUserRoleFlow = ai.defineFlow(
  {
    name: 'setUserRoleFlow',
    inputSchema: SetUserRole_InputSchema,
    outputSchema: z.void(),
    auth: async (auth, input) => {
        const req = auth as NextRequest;
        const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!idToken) {
            throw new Error('Unauthorized');
        }
        
        await initFirebaseAdmin();
        const decodedToken = await getAuth().verifyIdToken(idToken);
        
        if (decodedToken.superadmin !== true) {
            throw new Error('Only superadmins can change user roles.');
        }
    },
  },
  async input => {
    await initFirebaseAdmin();
    const auth = getAuth();
    
    const currentClaims = (await auth.getUser(input.uid)).customUserClaims || {};

    // Only update roles, preserve other claims like superadmin
    const newClaims = {
        ...currentClaims,
        role: input.role,
    };
    
    // A superadmin cannot have their 'superadmin' status removed this way.
    if (currentClaims.superadmin && input.role !== 'superadmin') {
      newClaims.role = 'superadmin';
    }

    // Ensure we don't accidentally remove superadmin status if it's not explicitly passed
    if (currentClaims.superadmin) {
        newClaims.superadmin = true;
    } else {
        // Prevent non-superadmins from being promoted to superadmin via this flow
        delete newClaims.superadmin;
    }
    
    await auth.setCustomUserClaims(input.uid, newClaims);
  }
);
