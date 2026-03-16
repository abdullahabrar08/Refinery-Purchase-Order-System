import { createContext } from "react";
import type { AuthSession, LoginPayload, UserRole } from "../types/domain";

export interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  logout: () => void;
  role: UserRole | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
