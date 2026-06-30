"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Shield, X } from "lucide-react";
import { adminApi as api } from "@/lib/api";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  _count: { testResults: number };
}

function AddAdminModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: AdminUser) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      const updated = await api.put(`/users/${data.user.id}`, { role: "ADMIN" });
      onAdd({ ...updated.data, _count: { testResults: 0 } });
      toast.success("Admin qo'shildi");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Yangi admin qo&apos;shish</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Ism", key: "name", type: "text", placeholder: "Ali Karimov" },
            { label: "Email", key: "email", type: "email", placeholder: "ali@example.com" },
            { label: "Parol", key: "password", type: "password", placeholder: "••••••••" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
              <input
                required type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition">
              {saving ? "Qo'shilmoqda…" : "Qo'shish"}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
              Bekor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditAdminModal({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (u: AdminUser) => void }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, password: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string> = { name: form.name, email: form.email };
      if (form.password) body.password = form.password;
      const { data } = await api.put(`/users/${user.id}`, body);
      onSave(data);
      toast.success("Admin yangilandi");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Admin tahrirlash</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Ism", key: "name", type: "text" },
            { label: "Email", key: "email", type: "email" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
              <input
                required type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Yangi parol <span className="font-normal text-gray-400">(bo&apos;sh qoldirsa o&apos;zgarmaydi)</span>
            </label>
            <input
              type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition">
              {saving ? "Saqlanmoqda…" : "Saqlash"}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
              Bekor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [confirmData, setConfirmData] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    api.get("/users").then((r) => {
      setAdmins((r.data as AdminUser[]).filter((u) => u.role === "ADMIN"));
    }).finally(() => setLoading(false));
  }, []);

  function handleDelete(u: AdminUser) {
    setConfirmData({
      message: `"${u.name}" admin akkauntini o'chirasizmi?`,
      onConfirm: async () => {
        setConfirmData(null);
        try {
          await api.delete(`/users/${u.id}`);
          setAdmins((prev) => prev.filter((x) => x.id !== u.id));
          toast.success("O'chirildi");
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
        }
      },
    });
  }

  return (
    <div className="p-4 sm:p-8">
      {confirmData && <ConfirmModal message={confirmData.message} onConfirm={confirmData.onConfirm} onCancel={() => setConfirmData(null)} />}
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Shield className="h-5 w-5 text-red-500" /> Adminlar
          </h1>
          <p className="text-sm text-gray-400">{admins.length} ta admin</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
        >
          <Plus className="h-4 w-4" /> Admin qo&apos;shish
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-6 py-4 text-left">Admin</th>
                <th className="px-4 py-4 text-center">Qo&apos;shilgan sana</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map((u) => (
                <tr key={u.id} className="group hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                        <Shield className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(u)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {admins.length === 0 && (
            <div className="py-16 text-center text-gray-400">Hech qanday admin yo&apos;q.</div>
          )}
        </div>
      )}

      {showAdd && (
        <AddAdminModal
          onClose={() => setShowAdd(false)}
          onAdd={(u) => setAdmins((p) => [u, ...p])}
        />
      )}
      {editing && (
        <EditAdminModal
          user={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => setAdmins((p) => p.map((u) => u.id === updated.id ? { ...u, ...updated } : u))}
        />
      )}
    </div>
  );
}
