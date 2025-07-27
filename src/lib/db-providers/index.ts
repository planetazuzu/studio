
// src/lib/db-providers/index.ts

import type { DBProvider } from './types';
import { dexieProvider } from './dexie';

// We always use the Dexie provider for the application logic.
// The synchronization to a cloud backend (like Supabase) is handled
// as a separate process and does not change the primary DB provider.
export const dbProvider: DBProvider = dexieProvider;
