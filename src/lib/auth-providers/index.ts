
import type { AuthProvider } from './types';
import * as dexie from './dexie';
import * as firebase from './firebase';
import * as auth0 from './auth0';
import * as supabase from './supabase';

const providers: Record<string, AuthProvider> = {
  dexie,
  firebase,
  auth0,
  supabase,
};

const key = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'dexie';

if (!providers[key]) {
  console.warn(`Auth provider "${key}" is not fully implemented. Falling back to 'dexie'.`);
}

export const authProvider: AuthProvider = providers[key] || providers['dexie'];
