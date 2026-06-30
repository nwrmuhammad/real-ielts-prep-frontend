"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { adminApi as api } from "@/lib/api";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  tariff: "XAVASKOR" | "ERKATOY";
  tariffExpiresAt?: string | null;
  createdAt: string;
  _count: { testResults: number };
}

function daysLeft(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Tariff modal ─────────────────────────────────────────────
function TariffModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (u: User) => void }) {
  const [saving, setSaving] = useState(false);

  async function set(tariff: "XAVASKOR" | "ERKATOY") {
    if (tariff === user.tariff) { onClose(); return; }
    setSaving(true);
    try {
      const { data } = await api.put(`/users/${user.id}`, { tariff });
      onSave({ ...user, tariff: data.tariff, tariffExpiresAt: data.tariffExpiresAt });
      toast.success(`Tariff "${tariff === "ERKATOY" ? "Erkatoy" : "Xavaskor"}" ga o'zgartirildi`);
      onClose();
    } catch { toast.error("Xatolik yuz berdi"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Assign Tariff</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-5 text-sm text-gray-400">{user.name} · {user.email}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => set("XAVASKOR")} disabled={saving}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition hover:shadow-md disabled:opacity-60 ${user.tariff === "XAVASKOR" ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-300"}`}>
            <span className="text-2xl">🎯</span>
            <span className="font-bold text-gray-900 text-sm">Xavaskor</span>
            <span className="text-xs text-gray-400 text-center">Free tests only</span>
            {user.tariff === "XAVASKOR" && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-white">Active</span>}
          </button>
          <button onClick={() => set("ERKATOY")} disabled={saving}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition hover:shadow-md disabled:opacity-60 ${user.tariff === "ERKATOY" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
            <span className="text-2xl">⭐</span>
            <span className="font-bold text-gray-900 text-sm">Erkatoy</span>
            <span className="text-xs text-gray-400 text-center">All tests + Predicted</span>
            {user.tariff === "ERKATOY" && (
              <>
                <span className="rounded-full bg-purple-500 px-2 py-0.5 text-xs font-bold text-white">Active</span>
                {daysLeft(user.tariffExpiresAt) !== null && (
                  <span className="text-xs text-purple-500 font-medium">{daysLeft(user.tariffExpiresAt)} kun qoldi</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add user modal ──────────────────────────────────────────
function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: User) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/auth/register", { name: form.name, email: form.email, password: form.password });
      onAdd({ ...data.user, createdAt: new Date().toISOString(), _count: { testResults: 0 } });
      toast.success("User qo'shildi");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Yangi user qo&apos;shish</h2>
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
              <input required type={type} value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition" />
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

// ─── Edit user modal ─────────────────────────────────────────
function EditUserModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (u: User) => void }) {
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
      toast.success("User yangilandi");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Userni tahrirlash</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Ism", key: "name", type: "text" },
            { label: "Email", key: "email", type: "email" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
              <input required type={type} value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition" />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Yangi parol <span className="text-gray-400 font-normal">(bo&apos;sh qoldirsa o&apos;zgarmaydi)</span>
            </label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition" />
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

// ─── Main ────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tariffUser, setTariffUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [confirmData, setConfirmData] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    api.get("/users").then((r) => {
      setUsers((r.data as User[]).filter((u) => u.role !== "ADMIN"));
    }).finally(() => setLoading(false));
  }, []);

  function handleDelete(u: User) {
    setConfirmData({
      message: `"${u.name}" ni o'chirishni tasdiqlaysizmi?`,
      onConfirm: async () => {
        setConfirmData(null);
        try {
          await api.delete(`/users/${u.id}`);
          setUsers((prev) => prev.filter((x) => x.id !== u.id));
          toast.success("O'chirildi");
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Xatolic yuz berdi");
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
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-400">{users.length} ta student</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-6 py-4 text-left">User</th>
                <th className="px-4 py-4 text-center">Tariff</th>
                <th className="px-4 py-4 text-center">Tests</th>
                <th className="px-4 py-4 text-center">Expires</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="group cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setTariffUser(u)}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      (u.tariff ?? "XAVASKOR") === "ERKATOY" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {(u.tariff ?? "XAVASKOR") === "ERKATOY" ? "Erkatoy" : "Xavaskor"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500">{u._count.testResults}</td>
                  <td className="px-4 py-4 text-center text-xs">
                    {u.tariff === "ERKATOY" && u.tariffExpiresAt ? (
                      <span className={daysLeft(u.tariffExpiresAt)! <= 5 ? "text-rose-500 font-semibold" : "text-gray-400"}>
                        {daysLeft(u.tariffExpiresAt)} kun qoldi
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditingUser(u)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(u)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-16 text-center text-gray-400">Hech qanday foydalanuvchi yo'q.</div>
          )}
        </div>
      )}

      {tariffUser && (
        <TariffModal user={tariffUser} onClose={() => setTariffUser(null)}
          onSave={(updated) => { setUsers((p) => p.map((u) => u.id === updated.id ? updated : u)); setTariffUser(null); }} />
      )}
      {showAddUser && (
        <AddUserModal onClose={() => setShowAddUser(false)}
          onAdd={(u) => setUsers((p) => [u, ...p])} />
      )}
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)}
          onSave={(updated) => setUsers((p) => p.map((u) => u.id === updated.id ? { ...u, ...updated } : u))} />
      )}
    </div>
  );
}
