/**
 * @fileOverview This file contains all the Zod schemas and TypeScript types for the application.
 * By centralizing them here, we can ensure they are easily accessible and managed, and we avoid
 * violating Next.js rules about exporting non-async functions from 'use server' files.
 */
import { z } from 'zod';

// Schema for creating a user
export const CreateUserInputSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['admin', 'user']).describe("The role to assign to the new user."),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

// Schema for the admin dashboard data
const UserWithNoteCountSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'user', 'superadmin']),
    noteCount: z.number(),
});
export const AdminDashboardDataSchema = z.object({
    users: z.array(UserWithNoteCountSchema),
    userCount: z.number(),
    noteCount: z.number(),
});
export type AdminDashboardData = z.infer<typeof AdminDashboardDataSchema>;

// Schema for setting a user's role
export const SetUserRoleInputSchema = z.object({
    uid: z.string().describe('The UID of the user to update.'),
    role: z.enum(['admin', 'user']).describe("The role to assign to the user."),
});
export type SetUserRoleInput = z.infer<typeof SetUserRoleInputSchema>;

// Schema for summarizing a note for search
export const SummarizeNoteForSearchInputSchema = z.object({
    note: z.string().describe('The content of the note to summarize.'),
});
export type SummarizeNoteForSearchInput = z.infer<typeof SummarizeNoteForSearchInputSchema>;

export const SummarizeNoteForSearchOutputSchema = z.object({
    summary: z.string().describe('A short summary of the note.'),
});
export type SummarizeNoteForSearchOutput = z.infer<typeof SummarizeNoteForSearchOutputSchema>;

// Schema for updating a user's details
export const UpdateUserInputSchema = z.object({
    uid: z.string().describe('The UID of the user to update.'),
    username: z.string().min(3, 'Username must be at least 3 characters').describe("The user's new username."),
});
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

// Schema for deleting a user
export const DeleteUserInputSchema = z.object({
    uid: z.string().describe('The UID of the user to delete.'),
});
export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

// Schema for updating a user's password
export const UpdateUserPasswordInputSchema = z.object({
    uid: z.string().describe('The UID of the user to update.'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').describe("The user's new password."),
});
export type UpdateUserPasswordInput = z.infer<typeof UpdateUserPasswordInputSchema>;
