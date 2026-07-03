"use client";
import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import api from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me", { silent: true })
      .then(({ data }) => {
        localStorage.setItem("user", JSON.stringify(data));
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem("user");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user as User;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user as User;
  }, []);

  const logout = useCallback(() => {
    api.post("/auth/logout").finally(() => {
      localStorage.removeItem("user");
      setUser(null);
      const isAdmin = window.location.pathname.startsWith("/admin");
      window.location.href = isAdmin ? "/admin/login" : "/login";
    });
  }, []);

  return { user, loading, login, register, logout };
}
