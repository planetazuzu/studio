
import type { User } from '@/lib/types';

// This is a placeholder implementation.
// To fully implement, you would use the Supabase SDK.

export async function login(email: string, password?: string): Promise<User | null> {
    console.error("Supabase login is not implemented. Using placeholder.");
    throw new Error("Supabase provider is not configured.");
}

export async function logout(): Promise<void> {
    console.error("Supabase logout is not implemented.");
}

export function subscribe(listener: (user: User | null) => void): () => void {
    console.error("Supabase subscribe is not implemented.");
    listener(null); // Always return logged out for placeholder
    return () => {}; // Return a no-op unsubscribe function
}
