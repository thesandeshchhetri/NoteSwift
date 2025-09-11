'use server';
/**
 * @fileOverview A flow to get user and note statistics for the admin dashboard.
 * 
 * - getUsersAndStats - Fetches all users, their note counts, and the total note count.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getFirestore, QuerySnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { User } from '@/types';
import { NextRequest } from 'next/server';
import { AdminDashboardDataSchema, type AdminDashboardData } from '@/types/schemas';


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

    let notesSnapshot: QuerySnapshot;
    try {
        // Only fetch notes that are not soft-deleted
        notesSnapshot = await db.collection('notes').where('deletedAt', '==', null).get();
    } catch (error: any) {
        // This can happen if the 'notes' collection does not exist at all or if the index is not ready.
        if (error.code === 5 || (error.details && error.details.includes("no matching index found"))) {
            notesSnapshot = { empty: true, size: 0, docs: [], forEach: () => {} } as unknown as QuerySnapshot;
        } else {
            console.error("Error fetching notes for stats:", error);
            throw error; // Re-throw other errors
        }
    }
    
    const noteCount = notesSnapshot.size;

    // Get all users from Auth
    const listUsersResult = await auth.listUsers();
    const authUsers = listUsersResult.users;
    const userCount = authUsers.length;
    
    // Get all user docs from Firestore
    let usersSnapshot: QuerySnapshot;
    try {
        usersSnapshot = await db.collection('users').get();
    } catch (error: any) {
        if (error.code === 5) { // NOT_FOUND
            usersSnapshot = { empty: true, docs: [], forEach: () => {} } as unknown as QuerySnapshot;
        } else {
            throw error;
        }
    }
    const firestoreUsers = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data() as Omit<User, 'id'>]));

    // Get note counts for each user from the already fetched active notes
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
