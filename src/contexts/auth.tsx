
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
    // We don't need to call populate here anymore,
    // it's handled on first import of the dexie provider.
    checkUserStatus();
  }, []);
  
  useEffect(() => {
      if (!isLoading && !user && !['/', '/login', '/register', '/pending-approval', '/terms', '/privacy-policy'].includes(pathname)) {
          router.push('/login');
      }
  }, [user, isLoading, router, pathname]);

  const checkUserStatus = async () => {
    setIsLoading(true);
    const loggedInUser = await db.getLoggedInUser();
    setUser(loggedInUser);
    setIsLoading(false);
  };

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
    router.push('/');
  };

  const value = { user, isLoading, login, logout };

  const isPublicPage = ['/', '/login', '/register', '/pending-approval', '/terms', '/privacy-policy'].includes(pathname);
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
