import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getToken, getUser, setToken, setUser, clearAuth } from '../lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        const savedUser = await getUser();
        if (savedUser) setUserState(savedUser);
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    if (res.success && res.data) {
      const { accessToken, refreshToken, user: userData } = res.data as any;
      await setToken(accessToken);
      await setUser(userData);
      setUserState(userData);
      return { success: true };
    }
    return { success: false, error: res.error?.message || res.message || 'Giriş başarısız' };
  };

  const logout = async () => {
    await clearAuth();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
