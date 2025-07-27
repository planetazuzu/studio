// src/lib/db-providers/index.ts

import type { DBProvider } from './types';
import { dexieProvider } from './dexie';
import { supabaseProvider } from './supabase';

const providers: Record<string, DBProvider> = {
  dexie:  dexieProvider,
  supabase: supabaseProvider,
};

// The auth provider now determines the DB provider.
// If using Supabase for auth, use it for DB as well.
const key = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'dexie';

if (!providers[key]) {
  throw new Error(`DB Provider "${key}" is not registered.`);
}

export const dbProvider: DBProvider = providers[key];
