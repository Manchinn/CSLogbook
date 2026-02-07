"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { login, type AuthUser, type LoginPayload } from "@/lib/api/authService";
import { MOCK_ROLE_KEY } from "@/lib/auth/mockSession";

const AUTH_TOKEN_KEY = "cslogbook:auth-token";
const AUTH_USER_KEY = "cslogbook:auth-user";

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthUser>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialSession() {
  if (typeof window === "undefined") {
    return { token: null as string | null, user: null as AuthUser | null };
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = window.localStorage.getItem(AUTH_USER_KEY);

  if (!token || !rawUser) {
    return { token: null as string | null, user: null as AuthUser | null };
  }

  return { token, user: JSON.parse(rawUser) as AuthUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialSession = getInitialSession();

  const [user, setUser] = useState<AuthUser | null>(initialSession.user);
  const [token, setToken] = useState<string | null>(initialSession.token);

  const signIn = async (payload: LoginPayload) => {
    const result = await login(payload);

    setToken(result.token);
    setUser(result.user);

    window.localStorage.setItem(AUTH_TOKEN_KEY, result.token);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
    window.localStorage.setItem(MOCK_ROLE_KEY, result.user.role);

    return result.user;
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    window.localStorage.removeItem(MOCK_ROLE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading: false,
      signIn,
      signOut,
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
