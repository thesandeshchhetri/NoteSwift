'use server';
/**
 * @fileOverview A flow to get user and note statistics for the admin dashboard.
 * 
 * - getUsersAndStats - Fetches all users, their note counts, and the total note count.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getFirestore, QuerySnapshot, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { User } from '@/types';
import { NextRequest } from 'next/server';
import { AdminDashboardDataSchema, type AdminDashboardData } from '@/types/schemas';
import { format } from 'date-fns';


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

    let allNotesSnapshot: QuerySnapshot;
    try {
        // Querying for all non-deleted notes. This might require a composite index in Firestore.
        allNotesSnapshot = await db.collection('notes').where('deletedAt', '==', null).get();
    } catch (error: any) {
        // If the specific query fails (e.g., due to a missing index), fall back to fetching all notes
        // and filtering in memory. This is less efficient but more resilient.
        console.warn('Query for active notes failed, falling back to fetching all notes. Consider creating a composite index on (userId, deletedAt). Error:', error.message);
        try {
            allNotesSnapshot = await db.collection('notes').get();
        } catch (innerError: any) {
            if (innerError.code === 5) { // NOT_FOUND for the 'notes' collection itself
                allNotesSnapshot = { empty: true, size: 0, docs: [], forEach: () => {} } as unknown as QuerySnapshot;
            } else {
                console.error("Error fetching any notes:", innerError);
                throw innerError; // Re-throw other errors
            }
        }
    }

    const activeNotes = allNotesSnapshot.docs.filter(doc => doc.data().deletedAt === null);
    const noteCount = activeNotes.length;

    // Chart Data Processing
    const notesByHour = Array(24).fill(0).map((_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, count: 0 }));
    const notesByDay: { [key: string]: number } = {};
    
    activeNotes.forEach(doc => {
      const data = doc.data();
      if (data.createdAt && data.createdAt instanceof Timestamp) {
        const createdAt = data.createdAt.toDate();
        
        // Aggregate by hour
        const hour = createdAt.getHours();
        notesByHour[hour].count++;

        // Aggregate by day (for last 30 days)
        const dateKey = format(createdAt, 'yyyy-MM-dd');
        notesByDay[dateKey] = (notesByDay[dateKey] || 0) + 1;
      }
    });

    const notesByDayArray = Object.entries(notesByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));


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
    activeNotes.forEach(doc => {
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

    return { users, userCount, noteCount, notesByHour, notesByDay: notesByDayArray };
  }
);