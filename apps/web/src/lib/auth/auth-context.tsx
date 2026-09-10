'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api/client';
import type { User } from '@/types/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isBarber: boolean;
  isCashier: boolean;
  isOwner: boolean;
  branchId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('barber_token');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('barber_token');
    }
    return true;
  });
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('barber_token');
    if (!savedToken) {
      return;
    }

    let ignore = false;
    api.auth
      .me()
      .then((profile) => {
        if (!ignore) {
          setUser(profile);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          if (err instanceof ApiError && err.statusCode === 401) {
            localStorage.removeItem('barber_token');
            setToken(null);
            setUser(null);
          }
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      localStorage.setItem('barber_token', res.accessToken);
      setToken(res.accessToken);
      const profile = await api.auth.me();
      setUser(profile);

      // Route according to role
      if (profile.role === 'BARBER') {
        router.push('/barber/queue');
      } else if (profile.role === 'CASHIER') {
        router.push('/pos');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('barber_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const isBarber = user?.role === 'BARBER';
  const isCashier = user?.role === 'CASHIER';
  const isOwner = user?.role === 'OWNER';
  const branchId = user?.branchId ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        isBarber,
        isCashier,
        isOwner,
        branchId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
