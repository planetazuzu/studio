'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  
  const publicPages = ['/', '/login', '/register', '/pending-approval', '/forgot-password', '/password-reset', '/features', '/terms', '/privacy-policy', '/request-demo'];
  
  const checkUserStatus = useCallback(async () => {
    // This function must only run on the client side
    if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    const loggedInUser = await db.getLoggedInUser();
    setUser(loggedInUser);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);
  
  useEffect(() => {
    // This effect should also only run on the client side
    if (typeof window === 'undefined') return;

    const isPublicPage = publicPages.includes(pathname);
    if (!isLoading && !user && !isPublicPage) {
        router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
