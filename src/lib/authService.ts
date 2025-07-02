
'use client';

import type { User } from '@/lib/types';
import { dexieAuthService } from '@/lib/auth-providers/dexie';
import { firebaseAuthService } from '@/lib/auth-providers/firebase';
import { auth0AuthService } from '@/lib/auth-providers/auth0';
import { supabaseAuthService } from '@/lib/auth-providers/supabase';

/**
 * Defines a common interface for any authentication service.
 * This allows the application to be agnostic about the auth provider being used.
 */
export interface AuthService {
  /**
   * Logs a user in.
   * @param email The user's email.
   * @param password The user's password (optional for some providers).
   * @returns A promise that resolves to the User object or null if login fails.
   */
  login(email: string, password?: string): Promise<User | null>;

  /**
   * Logs the current user out.
   */
  logout(): Promise<void>;

  /**
   * Gets the currently authenticated user, if any.
   * @returns A promise that resolves to the User object or null if no user is logged in.
   */
  getCurrentUser(): Promise<User | null>;
}

/**
 * Factory function that returns the currently active authentication service
 * based on the environment variable `NEXT_PUBLIC_AUTH_PROVIDER`.
 * Defaults to the local Dexie-based service if the variable is not set.
 */
export function getAuthService(): AuthService {
  const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'dexie';

  switch (provider) {
    case 'firebase':
      // In a real implementation, you would return firebaseAuthService.
      // We keep it on dexie for the demo to work out-of-the-box.
      console.warn("Firebase auth provider selected but not fully implemented. Using Dexie fallback.");
      return dexieAuthService;
      // return firebaseAuthService; 
    
    case 'auth0':
      console.warn("Auth0 provider selected but not fully implemented. Using Dexie fallback.");
      return dexieAuthService;
      // return auth0AuthService;

    case 'supabase':
      console.warn("Supabase provider selected but not fully implemented. Using Dexie fallback.");
      return dexieAuthService;
      // return supabaseAuthService;

    case 'dexie':
    default:
      return dexieAuthService;
  }
}
