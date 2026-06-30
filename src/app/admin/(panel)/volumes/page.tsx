"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, BookOpen, Users, X, Library } from "lucide-react";
import { Test } from "@/types";
import { adminApi as api } from "@/lib/api";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";

function extractVolNum(title: string): number | null {
  const m = title.match(/volume\s*(\d+)/i);
  return m ? parseInt(m[1]) : null;
}

export default function AdminVolumesPage() {
  const router = useRouter();
  const [volumes, setVolumes] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [volNum, setVolNum] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [saving, setSaving] = useState(false);
  const [confirmData, setConfirmData] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<Test[]>("/tests/admin/all");
      setVolumes(data.filter((t) => extractVolNum(t.title) !== null)
        .sort((a, b) => (extractVolNum(a.title) ?? 0) - (extractVolNum(b.title) ?? 0)));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!volNum || isNaN(Number(volNum))) { toast.error("Volume raqamini kiriting"); return; }
    setSaving(true);
    try {
      const title = `IELTS Academic Reading – Volume ${volNum}`;
      const { data } = await api.post("/tests", { title, description, timeLimit, isPublished: true });
      setVolumes((prev) => [...prev, data].sort((a, b) => (extractVolNum(a.title) ?? 0) - (extractVolNum(b.title) ?? 0)));
      setShowForm(false);
      setVolNum(""); setDescription(""); setTimeLimit(60);
      toast.success("Volume test yaratildi!");
      router.push(`/admin/tests/${data.id}`);
    } catch { toast.error("Xatolik yuz berdi"); }
    finally { setSaving(false); }
  }

  function handleDelete(id: string, title: string) {
    setConfirmData({
      message: `"${title}" testini o'chirasizmi?`,
      onConfirm: async () => {
        setConfirmData(null);
        try {
          await api.delete(`/tests/${id}`);
          setVolumes((prev) => prev.filter((v) => v.id !== id));
          toast.success("O'chirildi");
        } catch { toast.error("O'chirishda xatolik"); }
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
            <Library className="h-5 w-5 text-red-500" /> Volume Tests
          </h1>
          <p className="text-sm text-gray-400">Cambridge IELTS kitob testlari</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
        >
          {showForm ? <><X className="h-4 w-4" /> Bekor</> : <><Plus className="h-4 w-4" /> Qo'shish</>}
        </button>
      </div>

      {/* Manual add form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Yangi Volume Test</h2>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Volume raqami *</label>
              <input
                required type="number" min={1} max={99}
                value={volNum} onChange={(e) => setVolNum(e.target.value)}
                placeholder="9"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
              />
              {volNum && !isNaN(Number(volNum)) && (
                <p className="mt-1 text-xs text-gray-400">
                  Nom: <span className="font-medium text-gray-600">IELTS Academic Reading – Volume {volNum}</span>
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Vaqt (daqiqa)</label>
              <input
                type="number" min={10} max={180}
                value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tavsif</label>
              <textarea
                rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="3 ta passage, 40 ta savol..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="rounded-full bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition">
                {saving ? "Yaratilmoqda…" : "Yaratish"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
                Bekor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Volume list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />)}</div>
      ) : volumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <Library className="mb-3 h-10 w-10 text-gray-200" />
          <p className="font-medium text-gray-400">Volume testlar yo'q</p>
          <p className="mt-1 text-sm text-gray-300">Yuqoridagi tugmalar orqali qo'shing</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-6 py-4 text-left">Volume</th>
                <th className="px-4 py-4 text-center">Passages</th>
                <th className="px-4 py-4 text-center">Submissions</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {volumes.map((vol) => {
                const num = extractVolNum(vol.title);
                return (
                  <tr key={vol.id} className="group hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-sm font-extrabold text-white">
                          {num}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{vol.title}</div>
                          <div className="text-xs text-gray-400">{vol.timeLimit} daqiqa</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="flex items-center justify-center gap-1.5 text-gray-500">
                        <BookOpen className="h-3.5 w-3.5" />{vol._count?.passages ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="flex items-center justify-center gap-1.5 text-gray-500">
                        <Users className="h-3.5 w-3.5" />{vol._count?.testResults ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        vol.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {vol.isPublished ? "Published" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/tests/${vol.id}`)}
                          title="Tahrirlash"
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vol.id, vol.title)}
                          title="O'chirish"
                          className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
