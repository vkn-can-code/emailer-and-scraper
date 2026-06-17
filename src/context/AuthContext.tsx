'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (res.ok) {
          setIsAuthenticated(true);
          const storedAuth = localStorage.getItem('auth_session');
          if (storedAuth) {
            setUser(JSON.parse(storedAuth).user);
          } else {
            setUser({ username: 'admin' });
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          localStorage.removeItem('auth_session');
        }
      } catch (e) {
        console.error('Auth check failed', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const isAuthPage = pathname === '/login' || pathname?.startsWith('/api/auth');
    if (!isLoading && !isAuthenticated && !isAuthPage) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const userData = { username };
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('auth_session', JSON.stringify({ user: userData }));
        router.push('/dashboard');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth_session');
    router.push('/login');
  };

  // Only render children if:
  // 1. We are on the login page or auth callback
  // 2. We have finished loading AND we are authenticated
  const isAuthPage = pathname === '/login' || pathname?.startsWith('/api/auth');
  const shouldRender = isAuthPage || (!isLoading && isAuthenticated);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {shouldRender ? children : (
        isLoading ? null : null // Show nothing while redirecting
      )}
    </AuthContext.Provider>
  );
}



export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
