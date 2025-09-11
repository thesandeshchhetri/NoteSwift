import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-note-for-search.ts';
import '@/ai/flows/set-user-role.ts';
import '@/ai/flows/create-user.ts';
import '@/ai/flows/get-users-and-stats.ts';
import '@/ai/flows/update-user.ts';
import '@/ai/flows/delete-user.ts';
import '@/ai/flows/update-user-password.ts';
