'use server';
/**
 * @fileOverview A flow to get user and note statistics for the admin dashboard.
 * 
 * - getUsersAndStats - Fetches all users, their note counts, and the total note count.
 * - AdminDashboardData - The return type for the getUsersAndStats function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { User } from '@/types';
import { NextRequest } from 'next/server';

const UserWithNoteCountSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'user', 'superadmin']),
    noteCount: z.number(),
});

const AdminDashboardDataSchema = z.object({
  users: z.array(UserWithNoteCountSchema),
  userCount: z.number(),
  noteCount: z.number(),
});
export type AdminDashboardData = z.infer<typeof AdminDashboardDataSchema>;

export async function getUsersAndStats(): Promise<AdminDashboardData> {
  return getUsersAndStatsFlow();
}

const getUsersAndStatsFlow = ai.defineFlow(
  {
    name: 'getUsersAndStatsFlow',
    inputSchema: z.void(),
    outputSchema: AdminDashboardDataSchema,
    auth: async (auth, input) => {
        const req = auth as NextRequest;
        const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!idToken) {
            throw new Error('Unauthorized: No token provided.');
        }
        
        await initFirebaseAdmin();
        const decodedToken = await getAuth().verifyIdToken(idToken);
        
        const isSuperAdmin = decodedToken.superadmin === true;
        const isAdmin = decodedToken.role === 'admin';

        if (!isSuperAdmin && !isAdmin) {
            throw new Error('Forbidden: Only admins or superadmins can access this data.');
        }
    },
  },
  async () => {
    await initFirebaseAdmin();
    const db = getFirestore();
    const auth = getAuth();

    // Get all notes
    const notesSnapshot = await db.collection('notes').get();
    const noteCount = notesSnapshot.size;

    // Get all users from Auth
    const listUsersResult = await auth.listUsers();
    const authUsers = listUsersResult.users;
    const userCount = authUsers.length;
    
    // Get all user docs from Firestore
    const usersSnapshot = await db.collection('users').get();
    const firestoreUsers = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data() as Omit<User, 'id'>]));

    // Get note counts for each user
    const notesByUserId = new Map<string, number>();
    notesSnapshot.forEach(doc => {
        const userId = doc.data().userId;
        notesByUserId.set(userId, (notesByUserId.get(userId) || 0) + 1);
    });

    const users = authUsers.map(userRecord => {
        const firestoreUser = firestoreUsers.get(userRecord.uid);
        const customClaims = userRecord.customClaims || {};
        const role = customClaims.superadmin ? 'superadmin' : customClaims.role || 'user';

        return {
            id: userRecord.uid,
            username: firestoreUser?.username || userRecord.displayName || 'N/A',
            email: userRecord.email!,
            role: role as 'superadmin' | 'admin' | 'user',
            noteCount: notesByUserId.get(userRecord.uid) || 0,
        };
    });

    return { users, userCount, noteCount };
  }
);
