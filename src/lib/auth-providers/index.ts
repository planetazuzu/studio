
import type { AuthProvider } from './types';
import * as dexie from './dexie';

const providers: Record<string, AuthProvider> = {
  dexie,
};

const key = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'dexie';

if (!providers[key]) {
  console.warn(`Auth provider "${key}" is not fully implemented. Falling back to 'dexie'.`);
}

export const authProvider: AuthProvider = providers[key] || providers['dexie'];
