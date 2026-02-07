"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login, verifyToken, type AuthUser, type LoginPayload } from "@/lib/api/authService";
import { MOCK_ROLE_KEY } from "@/lib/auth/mockSession";

const AUTH_TOKEN_KEY = "cslogbook:auth-token";
const AUTH_USER_KEY = "cslogbook:auth-user";

function parseTokenPayload(token: string) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload)) as { exp?: number };
  } catch (error) {
    console.warn("Failed to parse token payload", error);
    return {};
  }
}

function getTokenExpiryMs(token: string): number | null {
  const payload = parseTokenPayload(token);
  if (!payload.exp) return null;
  return payload.exp * 1000;
}

function isTokenExpired(token: string): boolean {
  const expiryMs = getTokenExpiryMs(token);
  return typeof expiryMs === "number" ? Date.now() >= expiryMs : false;
}

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthUser>;
  completeSsoLogin: (token: string) => Promise<AuthUser>;
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

  if (isTokenExpired(token)) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    return { token: null as string | null, user: null as AuthUser | null };
  }

  return { token, user: JSON.parse(rawUser) as AuthUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialSession = getInitialSession();
  const [user, setUser] = useState<AuthUser | null>(initialSession.user);
  const [token, setToken] = useState<string | null>(initialSession.token);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    window.localStorage.removeItem(MOCK_ROLE_KEY);
  }, []);

  const persistSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);

    window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    window.localStorage.setItem(MOCK_ROLE_KEY, nextUser.role);
  }, []);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const result = await login(payload);

    persistSession(result.token, result.user);

    return result.user;
  }, [persistSession]);

  const completeSsoLogin = useCallback(async (nextToken: string) => {
    const profile = await verifyToken(nextToken);
    persistSession(nextToken, profile);
    return profile;
  }, [persistSession]);

  const signOut = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setIsLoading(false);
      return undefined;
    }

    if (isTokenExpired(token)) {
      clearSession();
      setIsLoading(false);
      return undefined;
    }

    const expiryMs = getTokenExpiryMs(token);
    const timeoutId = typeof expiryMs === "number" ? window.setTimeout(clearSession, Math.max(expiryMs - Date.now(), 0)) : undefined;

    verifyToken(token)
      .then((profile) => {
        if (cancelled) return;
        persistSession(token, profile);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [clearSession, persistSession, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      signIn,
      completeSsoLogin,
      signOut,
    }),
    [completeSsoLogin, isLoading, signIn, signOut, token, user],
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
