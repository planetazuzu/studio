
import type { User } from '@/lib/types';
import * as db from '@/lib/db';

let currentUser: User | null = null;
const listeners = new Set<(user: User | null) => void>();

// Check initial state
db.getLoggedInUser().then(user => {
  currentUser = user;
  listeners.forEach(l => l(currentUser));
});

export async function login(email: string, password?: string): Promise<User | null> {
    if (!password) {
      throw new Error("La contraseña es obligatoria para el inicio de sesión local.");
    }
    const user = await db.login(email, password);
    currentUser = user;
    listeners.forEach(l => l(currentUser));
    return user;
}

export async function logout(): Promise<void> {
    db.logout();
    currentUser = null;
    listeners.forEach(l => l(null));
}

export function subscribe(listener: (user: User | null) => void): () => void {
    // Immediately call listener with current state
    listener(currentUser);
    
    listeners.add(listener);
    
    return () => {
        listeners.delete(listener);
    };
}
