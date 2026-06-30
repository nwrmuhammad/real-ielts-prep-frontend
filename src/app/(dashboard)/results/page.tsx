"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Clock, ChevronRight, Calendar, CheckCircle2, BookOpen } from "lucide-react";
import { TestResult } from "@/types";
import api from "@/lib/api";

function BandBadge({ score }: { score: number }) {
  const c = score >= 7 ? "bg-green-100 text-green-700" :
            score >= 5.5 ? "bg-amber-100 text-amber-700" :
            "bg-gray-100 text-black";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${c}`}>
      Band {score}
    </span>
  );
}

function BandMeter({ score }: { score: number }) {
  const pct = ((score - 1) / 8) * 100;
  const color = score >= 7 ? "bg-green-500" : score >= 5.5 ? "bg-amber-400" : "bg-gray-600";
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-bold text-gray-500">{score}</span>
    </div>
  );
}

export default function ResultsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/results/my").then((r) => setResults(r.data)).finally(() => setLoading(false));
  }, []);

  const completed = results.filter((r) => r.bandScore);
  const avgBand = completed.length
    ? (completed.reduce((s, r) => s + (r.bandScore ?? 0), 0) / completed.length).toFixed(1)
    : null;

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-black">IELTS READING</p>
          <h1 className="mt-1 text-2xl font-extrabold text-black">My Results</h1>
          <p className="mt-0.5 text-gray-500">Review your test history and track progress.</p>
        </div>
        <Link href="/tests" className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition shadow-sm">
          + New Test
        </Link>
      </div>

      {completed.length > 0 && (
        <div className="mb-6 grid gap-3 grid-cols-1 sm:grid-cols-3">
          {[
            { label: "Tests Done", value: completed.length, icon: BookOpen, color: "text-black bg-gray-50" },
            { label: "Average Band", value: avgBand, icon: BarChart3, color: "text-green-600 bg-green-50" },
            { label: "Best Score", value: Math.max(...completed.map((r) => r.rawScore ?? 0)) + "/" + (completed[0]?.totalPoints ?? 40), icon: CheckCircle2, color: "text-amber-600 bg-amber-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-black">{value ?? "—"}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white py-20 shadow-sm">
          <BarChart3 className="mb-4 h-12 w-12 text-red-100" />
          <p className="text-gray-500">No results yet.</p>
          <Link href="/tests" className="mt-4 text-sm font-medium text-black hover:underline">
            Take your first test →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/results/${r.id}`}
              className="group flex items-center gap-5 rounded-2xl border border-red-100 bg-white p-5 shadow-sm hover:border-red-200 hover:shadow-md transition-all"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-50">
                <BookOpen className="h-5 w-5 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-black truncate">{r.test?.title}</p>
                <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "In progress"}
                  </span>
                  {r.timeSpent && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {Math.round(r.timeSpent / 60)} min
                    </span>
                  )}
                  <span className="font-medium text-gray-600">{r.rawScore ?? "—"}/{r.totalPoints ?? 40} correct</span>
                </div>
                {r.bandScore && (
                  <div className="mt-2 max-w-xs">
                    <BandMeter score={r.bandScore} />
                  </div>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                {r.bandScore ? <BandBadge score={r.bandScore} /> : <span className="text-xs text-gray-400">In progress</span>}
                <ChevronRight className="h-4 w-4 text-red-200 group-hover:text-gray-600 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
