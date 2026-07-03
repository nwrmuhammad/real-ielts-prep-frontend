"use client";
import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import { adminApi } from "@/lib/api";

// Admin uchun alohida storage key — student sessiyasiga tegmaydi.
// Haqiqiy sessiya httpOnly "admin_token" cookie'da, JS unga umuman kira olmaydi.
const USER_KEY = "admin_user";

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get("/auth/me", { silent: true })
      .then(({ data }) => {
        localStorage.setItem(USER_KEY, JSON.stringify(data));
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await adminApi.post("/auth/login", { email, password });
    if (data.user?.role !== "ADMIN") throw new Error("not_admin");
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user as User;
  }, []);

  const logout = useCallback(() => {
    adminApi.post("/auth/logout").finally(() => {
      localStorage.removeItem(USER_KEY);
      setUser(null);
      window.location.href = "/admin/login";
    });
  }, []);

  return { user, loading, login, logout };
}
