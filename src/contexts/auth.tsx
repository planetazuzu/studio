
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const pathname = usePathname();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await db.populateDatabase();
        // For development: auto-login as admin user
        const defaultUser = await db.getUserById('user_1'); // Elena Vargas
        if (defaultUser && defaultUser.password) {
          const loggedInUser = await db.login(defaultUser.email, defaultUser.password);
          setUser(loggedInUser);
        } else {
          // Fallback to normal flow if default user isn't available
          const loggedInUser = await db.getLoggedInUser();
          setUser(loggedInUser);
        }
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
    try {
        const loggedInUser = await db.login(email, password);
        setUser(loggedInUser);
        return loggedInUser;
    } catch(error) {
        // Propagate error to be caught in the form
        throw error;
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    db.logout();
    setUser(null);
    router.push('/login');
  };

  const value = { user, isLoading, login, logout };

  // If loading, show a spinner, unless we're on a public page
  const isPublicPage = ['/login', '/register', '/pending-approval'].includes(pathname);
  if (isLoading && !isPublicPage) {
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
