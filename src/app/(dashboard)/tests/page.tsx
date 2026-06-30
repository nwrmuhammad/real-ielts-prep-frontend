"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Clock, BookOpen } from "lucide-react";
import { Test } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

function PredictedModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
          <Lock className="h-7 w-7 text-purple-600" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-black">Upgrade Required</h2>
        <p className="mb-5 text-sm text-gray-400">
          Predicted tests are available on the <span className="font-semibold text-black">Erkatoy</span> plan.
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
          Contact on Telegram
        </a>
        <button
          onClick={onClose}
          className="w-full rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function extractVolumeNumber(title: string): number | null {
  const match = title.match(/volume\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

type Filter = "practice" | "volume" | "predicted";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "practice",  label: "Free Practice" },
  { key: "volume",    label: "IELTS Volume"  },
  { key: "predicted", label: "Predicted"     },
];

const PASSAGE_CATS = [1, 2, 3] as const;

export default function TestsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("practice");
  const [passageCat, setPassageCat] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get("/tests").then((r) => setTests(r.data)).finally(() => setLoading(false));
  }, []);

  const isPredicted = (t: Test) => (t.status ?? "FREE") === "PREDICTED";
  const canAccess   = (t: Test) => user?.role === "ADMIN" || user?.tariff === "ERKATOY" || !isPredicted(t);

  const visible = tests
    .filter((t) => {
      if (filter === "volume")    return !isPredicted(t) && extractVolumeNumber(t.title) !== null;
      if (filter === "practice")  return !isPredicted(t) && extractVolumeNumber(t.title) === null;
      if (filter === "predicted") {
        if (!isPredicted(t)) return false;
        if (passageCat !== null) return (t.passageCategory ?? null) === passageCat;
        return true;
      }
      return false;
    })
    .sort((a, b) => {
      if (filter === "volume") return (extractVolumeNumber(a.title) ?? 0) - (extractVolumeNumber(b.title) ?? 0);
      if (filter === "predicted") return (a.passageCategory ?? 99) - (b.passageCategory ?? 99);
      return 0;
    });

  function sublabel(t: Test) {
    if (isPredicted(t)) {
      const cat = t.passageCategory;
      return cat ? `Predicted · Passage ${cat}` : "Predicted";
    }
    const vol = extractVolumeNumber(t.title);
    if (vol !== null) return `Vol ${vol}`;
    return "Free Practice";
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">

      {/* Fixed header */}
      <div className="shrink-0 border-b border-gray-100 px-6 sm:px-10 pt-7 pb-5">
        <div className="mx-auto max-w-screen-xl">
          <h1 className="mb-5 text-2xl font-bold text-gray-900">Reading Tests</h1>
          <div className="flex gap-2.5 flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFilter(key); setPassageCat(null); }}
                className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
                  filter === key
                    ? key === "predicted"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6">
        <div className="mx-auto max-w-screen-xl">

          {filter === "predicted" && (
            <div className="mb-5">
              <p className="mb-3 text-sm italic text-gray-400">
                Reading passages most likely to appear in your upcoming IELTS exam.
                {!(user?.role === "ADMIN" || user?.tariff === "ERKATOY") && (
                  <> —{" "}
                    <a href="https://t.me/nvrmuhammad" target="_blank" rel="noopener noreferrer"
                      className="font-semibold text-purple-600 not-italic hover:underline">
                      upgrade to Erkatoy →
                    </a>
                  </>
                )}
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setPassageCat(null)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    passageCat === null
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  All
                </button>
                {PASSAGE_CATS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPassageCat(n)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                      passageCat === n
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    Passage {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="py-24 text-center text-gray-400">No tests available yet.</div>
          ) : (
            <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((test) => {
                const locked = !canAccess(test);
                const predicted = isPredicted(test);

                const card = (
                  <div className={`flex h-full flex-col justify-between rounded-2xl border bg-white px-5 py-5 transition ${
                    locked
                      ? "border-gray-100 cursor-pointer hover:border-purple-200 hover:bg-purple-50/30"
                      : "border-gray-200 cursor-pointer hover:border-gray-300 hover:shadow-md"
                  }`}>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug">
                        {filter === "volume" && extractVolumeNumber(test.title) !== null
                          ? `TEST ${extractVolumeNumber(test.title)}`
                          : test.title}
                      </p>
                      <div className="mt-2 flex items-center gap-2.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {test.timeLimit}m
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> {test._count?.passages ?? 0} passages
                        </span>
                      </div>
                      <p className={`mt-1.5 text-xs font-medium ${predicted ? "text-purple-500" : "text-gray-400"}`}>
                        {sublabel(test)}
                      </p>
                    </div>
                    <div className="mt-3 flex justify-end">
                      {locked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">
                          <Lock className="h-3 w-3" /> Premium
                        </span>
                      ) : (
                        <span className="inline-block rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600">
                          Start
                        </span>
                      )}
                    </div>
                  </div>
                );

                if (locked) return <div key={test.id} className="h-full" onClick={() => setShowModal(true)}>{card}</div>;
                return <Link key={test.id} className="h-full" href={`/tests/${test.id}`}>{card}</Link>;
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && <PredictedModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
