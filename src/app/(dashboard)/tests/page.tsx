"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, BookOpen, Users, Search, ChevronRight, Lock, X, Sparkles } from "lucide-react";
import { Test } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

const FILTERS = ["Full Test", "Part 1", "Part 2", "Part 3"];

function PredictedModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
          <Lock className="h-7 w-7 text-purple-600" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-black">Access Restricted</h2>
        <p className="mb-1 text-sm text-gray-500">
          You are not on the <span className="font-bold text-purple-600">"Erkatoy"</span> plan.
        </p>
        <p className="mb-5 text-sm text-gray-400">
          Upgrade to the <span className="font-semibold text-black">Erkatoy</span> plan to access Predicted tests.
        </p>
        <a
          href="https://t.me/nvrmuhammad"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#2AABEE] py-2.5 text-sm font-bold text-white hover:bg-[#229ED9] transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Contact admin on Telegram
        </a>
        <button
          onClick={onClose}
          className="w-full rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default function TestsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Full Test");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get("/tests").then((r) => setTests(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = tests.filter((t) => {
    const matchesQuery =
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;

    const passageCount = t._count?.passages ?? t.passages?.length ?? 0;
    if (activeFilter === "Full Test") return true;
    if (activeFilter === "Part 1") return passageCount === 1;
    if (activeFilter === "Part 2") return passageCount === 2;
    if (activeFilter === "Part 3") return passageCount >= 3;
    return true;
  });

  const isPredicted = (test: Test) => (test.status ?? "FREE") === "PREDICTED";
  const canAccess = (test: Test) =>
    user?.role === "ADMIN" || user?.tariff === "ERKATOY" || !isPredicted(test);

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-screen-2xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-black">IELTS READING</p>
        <h1 className="mt-1 text-2xl font-extrabold text-black">Reading Practice Tests</h1>
        <p className="mt-1 text-gray-500">Practise under real exam conditions and track your band score.</p>
      </div>

      {/* Search + filter row */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tests…"
            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeFilter === f
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm font-semibold text-gray-500">Reading Question Sets</p>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">No tests found.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((test) => {
            const locked = !canAccess(test);
            return (
              <div key={test.id} className={`group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all ${
                locked
                  ? "border-gray-100 opacity-90"
                  : "border-gray-100 hover:border-red-200 hover:shadow-md"
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-black text-sm leading-snug line-clamp-2">{test.title}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {test.passages?.length ? `${test.passages.length} passages` : "Full test"}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                    isPredicted(test)
                      ? "bg-purple-100 text-purple-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {isPredicted(test) ? "Predicted" : "Free"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {test.timeLimit}m</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {test._count?.passages ?? 0}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {test._count?.testResults ?? 0}</span>
                </div>

                {(test.passages?.length ?? 0) > 0 && (
                  <div className="mt-3 space-y-1">
                    {test.passages!.slice(0, 3).map((p, pi) => (
                      <div key={p.id} className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="font-medium text-gray-500">Part {pi + 1}</span>
                        <span className="truncate">{p.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between">
                  {locked ? (
                    <button
                      onClick={() => setShowModal(true)}
                      className="flex items-center gap-1.5 rounded-full bg-purple-100 px-5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-200 transition"
                    >
                      <Lock className="h-3 w-3" /> Start
                    </button>
                  ) : (
                    <Link href={`/tests/${test.id}`}
                      className="rounded-full bg-red-500 px-5 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition">
                      Start
                    </Link>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {showModal && <PredictedModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
