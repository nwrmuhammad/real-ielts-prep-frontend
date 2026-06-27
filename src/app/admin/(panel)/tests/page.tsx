"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Users, X } from "lucide-react";
import { Test } from "@/types";
import api from "@/lib/api";
import toast from "react-hot-toast";

function StatusDropdown({ status, onChange }: {
  status: "FREE" | "PREDICTED";
  onChange: (next: "FREE" | "PREDICTED") => void;
}) {
  const [open, setOpen] = useState(false);
  const options = [
    { value: "FREE"      as const, label: "Free",      cls: "bg-amber-100 text-amber-700" },
    { value: "PREDICTED" as const, label: "Predicted", cls: "bg-purple-100 text-purple-700" },
  ];
  const current = options.find((o) => o.value === (status ?? "FREE")) ?? options[0];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition hover:opacity-80 cursor-pointer ${current.cls}`}
      >
        {current.label}
        <svg className="h-3 w-3 opacity-60" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 z-20 mt-1 w-32 -translate-x-1/2 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setOpen(false); if (opt.value !== status) onChange(opt.value); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold transition hover:bg-gray-50 ${opt.value === status ? "opacity-40 cursor-default" : "cursor-pointer"}`}
              >
                <span className={`h-2 w-2 rounded-full ${opt.value === "FREE" ? "bg-amber-400" : "bg-purple-500"}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", timeLimit: 60 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/tests/admin/all").then((r) => setTests(r.data)).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/tests", form);
      setTests((prev) => [data, ...prev]);
      setForm({ title: "", description: "", timeLimit: 60 });
      setShowForm(false);
      toast.success("Test created!");
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  }

  async function togglePublish(test: Test) {
    try {
      const { data } = await api.put(`/tests/${test.id}`, { isPublished: !test.isPublished });
      setTests((prev) => prev.map((t) => t.id === test.id ? { ...t, isPublished: data.isPublished } : t));
      toast.success(data.isPublished ? "Published" : "Hidden");
    } catch { toast.error("Failed to update"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this test?")) return;
    try {
      await api.delete(`/tests/${id}`);
      setTests((prev) => prev.filter((t) => t.id !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tests</h1>
          <p className="text-sm text-gray-400">{tests.length} test mavjud</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
        >
          {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> New Test</>}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-semibold text-gray-900">Create New Test</h2>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Test Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="IELTS Academic Reading – Practice Test 1"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="Brief description…"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Time Limit (min)</label>
              <input type="number" min={10} max={180} value={form.timeLimit}
                onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition" />
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" disabled={saving}
                className="flex-1 rounded-full bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition">
                {saving ? "Creating…" : "Create Test"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />)}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-6 py-4 text-left">Test</th>
                <th className="px-4 py-4 text-center">Passages</th>
                <th className="px-4 py-4 text-center">Submissions</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tests.map((test) => (
                <tr key={test.id} className="group hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{test.title}</div>
                    <div className="text-xs text-gray-400">{test.timeLimit} minutes</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="flex items-center justify-center gap-1.5 text-gray-500">
                      <BookOpen className="h-3.5 w-3.5" />{test._count?.passages ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="flex items-center justify-center gap-1.5 text-gray-500">
                      <Users className="h-3.5 w-3.5" />{test._count?.testResults ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      test.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {test.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusDropdown
                      status={test.status}
                      onChange={async (next) => {
                        try {
                          await api.put(`/tests/${test.id}`, { status: next });
                          setTests((prev) => prev.map((t) => t.id === test.id ? { ...t, status: next } : t));
                        } catch { toast.error("Failed to update"); }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => togglePublish(test)} title={test.isPublished ? "Hide" : "Publish"}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
                        {test.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => router.push(`/admin/tests/${test.id}`)} title="Edit"
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(test.id)} title="Delete"
                        className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tests.length === 0 && (
            <div className="py-16 text-center text-gray-400">No tests yet. Click "New Test" to create one.</div>
          )}
        </div>
      )}
    </div>
  );
}
