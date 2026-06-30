"use client";
import { useState } from "react";
import { Shield, Save, KeyRound, User } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminApi as api } from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminProfilePage() {
  const { user, loading } = useAdminAuth();

  const [info, setInfo] = useState({ name: "", email: "" });
  const [infoReady, setInfoReady] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  const [pwd, setPwd] = useState({ newPassword: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);

  // Populate form once user loads
  if (!infoReady && user) {
    setInfo({ name: user.name, email: user.email });
    setInfoReady(true);
  }

  async function handleInfoSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingInfo(true);
    try {
      const { data } = await api.put(`/users/${user.id}`, {
        name: info.name.trim(),
        email: info.email.trim(),
      });
      localStorage.setItem("admin_user", JSON.stringify(data));
      toast.success("Ma'lumotlar yangilandi");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
    } finally { setSavingInfo(false); }
  }

  async function handlePwdSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (pwd.newPassword !== pwd.confirm) {
      toast.error("Parollar mos kelmadi");
      return;
    }
    if (pwd.newPassword.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setSavingPwd(true);
    try {
      await api.put(`/users/${user.id}`, { password: pwd.newPassword });
      setPwd({ newPassword: "", confirm: "" });
      toast.success("Parol yangilandi");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
    } finally { setSavingPwd(false); }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  const initials = user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "A";

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-xl font-bold text-white">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-600">
              <Shield className="h-3 w-3" /> Admin
            </span>
          </div>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>
      </div>

      {/* Personal info */}
      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-gray-900">
          <User className="h-4 w-4 text-gray-400" /> Shaxsiy ma&apos;lumotlar
        </h2>
        <form onSubmit={handleInfoSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ism</label>
            <input
              required
              value={info.name}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input
              required type="email"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
            />
          </div>
          <button
            type="submit" disabled={savingInfo}
            className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition"
          >
            <Save className="h-4 w-4" />
            {savingInfo ? "Saqlanmoqda…" : "Saqlash"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-gray-900">
          <KeyRound className="h-4 w-4 text-gray-400" /> Parolni o&apos;zgartirish
        </h2>
        <form onSubmit={handlePwdSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Yangi parol</label>
            <input
              required type="password"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Parolni tasdiqlang</label>
            <input
              required type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
            />
          </div>
          <button
            type="submit" disabled={savingPwd}
            className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 transition"
          >
            <KeyRound className="h-4 w-4" />
            {savingPwd ? "Saqlanmoqda…" : "Parolni yangilash"}
          </button>
        </form>
      </div>
    </div>
  );
}
