
// src/lib/auth-providers/dexie.ts
import type { User } from '../types';
import type { AuthService } from '../authService';
import * as db from '../db';

/**
 * Implements the AuthService interface using the local Dexie.js database.
 * This is suitable for development, testing, and offline-first prototypes.
 * NOT recommended for production environments with public access.
 */
class DexieAuthService implements AuthService {
  async login(email: string, password?: string): Promise<User | null> {
    if (!password) {
      throw new Error("La contraseña es obligatoria para el inicio de sesión local.");
    }
    return db.login(email, password);
  }

  async logout(): Promise<void> {
    db.logout();
    return Promise.resolve();
  }

  async getCurrentUser(): Promise<User | null> {
    return db.getLoggedInUser();
  }
}

export const dexieAuthService = new DexieAuthService();
