// src/lib/db-providers/index.ts

import type { DBProvider } from './types';
import { dexieProvider } from './dexie';
// import { restProvider } from './rest'; // Future implementation

const providers: Record<string, DBProvider> = {
  dexie:  dexieProvider,
  // rest:  restProvider, // Future implementation
};

// For this project, we hard-code the Dexie provider as it's the core
// of the offline-first architecture. An environment variable could be
// used here to switch to a different provider (e.g., a REST API wrapper).
const key = process.env.NEXT_PUBLIC_DB_PROVIDER || 'dexie';

if (!providers[key]) {
  throw new Error(`DB Provider "${key}" is not registered.`);
}

export const dbProvider: DBProvider = providers[key];
