
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import * as db from '@/lib/db';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First, ensure the database is populated. This is fast if already populated.
        await db.populateDatabase();
        // Then, check for a logged-in user.
        const loggedInUser = await db.getLoggedInUser();
        setUser(loggedInUser);
      } catch (error) {
        console.error("Failed to initialize app", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    const loggedInUser = await db.login(email, password);
    setUser(loggedInUser);
    setIsLoading(false);
    return loggedInUser;
  };

  const logout = () => {
    db.logout();
    setUser(null);
    router.push('/login');
  };

  const value = { user, isLoading, login, logout };

  if (isLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
