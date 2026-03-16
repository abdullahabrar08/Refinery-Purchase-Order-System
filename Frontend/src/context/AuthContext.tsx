import {
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { ApiClient } from "../lib/api";
import { AUTH_STORAGE_KEY } from "../lib/constants";
import type { AuthSession } from "../types/domain";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    try {
      return JSON.parse(storedValue) as AuthSession;
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      role: session?.user.role ?? null,
      async login(payload) {
        const nextSession = await ApiClient.login(payload);
        setSession(nextSession);
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));

        return nextSession;
      },
      logout() {
        setSession(null);
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    [session],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
