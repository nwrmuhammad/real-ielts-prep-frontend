"use client";
import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import api, { adminApi } from "@/lib/api";

// Admin uchun alohida storage keys — student sessiyasiga tegmaydi
const TOKEN_KEY = "admin_token";
const USER_KEY  = "admin_user";

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }

    adminApi.get("/auth/me")
      .then(({ data }) => {
        localStorage.setItem(USER_KEY, JSON.stringify(data));
        setUser(data);
      })
      .catch(() => {
        // adminApi response interceptor handles 401 redirect automatically
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password }, {
      headers: { "X-Admin-Login": "1" },
    });
    if (data.user?.role !== "ADMIN") throw new Error("not_admin");
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user as User;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    window.location.href = "/admin/login";
  }, []);

  return { user, loading, login, logout };
}

/** Admin token ni API so'rovlari uchun olish */
export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
