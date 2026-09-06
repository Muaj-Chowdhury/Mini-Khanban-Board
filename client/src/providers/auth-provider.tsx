"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
} from "@/lib/auth";

export interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData?: User) => Promise<void>;
  register: (payload: { name?: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  async function fetchCurrentUser() {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.data);
    } catch {
      removeAccessToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const initAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await api.get("/auth/me");
        if (active) {
          setUser(response.data.data);
        }
      } catch {
        removeAccessToken();
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    return () => {
      active = false;
    };
  }, []);

  async function login(token: string, userData?: User) {
    setAccessToken(token);
    if (userData) {
      setUser(userData);
    } else {
      await fetchCurrentUser();
    }
  }

  async function register(payload: { name?: string; email: string; password: string }) {
    await api.post("/auth/register", payload);
  }

  function logout() {
    removeAccessToken();
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refetchUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
