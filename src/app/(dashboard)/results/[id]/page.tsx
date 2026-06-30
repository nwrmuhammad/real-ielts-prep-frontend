"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TestResult, Answer } from "@/types";
import api from "@/lib/api";

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/results/${id}`).then((r) => setResult(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
    </div>
  );
  if (!result) return <div className="py-20 text-center text-gray-400">Result not found.</div>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-lg font-bold text-gray-900">{result.test?.title}</h1>
          <div className="flex items-baseline gap-4">
            {result.bandScore && (
              <span className="text-2xl font-extrabold text-red-500">
                Band {result.bandScore}
              </span>
            )}
            <span className="text-2xl font-extrabold text-gray-900">
              {result.rawScore ?? result.answers?.filter((a: Answer) => a.isCorrect).length ?? 0}
              <span className="text-base font-medium text-gray-400">/{result.totalPoints ?? result.answers?.length ?? 40}</span>
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-white text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 text-center w-12">#</th>
                <th className="px-5 py-3 text-left">My Answer</th>
                <th className="px-5 py-3 text-left">True Answer</th>
              </tr>
            </thead>
            <tbody>
              {result.answers?.map((a: Answer, i: number) => {
                const bg = !a.userAnswer ? "#fff1b8" : a.isCorrect ? "#d9f7be" : "#ffccc7";
                const hoverBg = !a.userAnswer ? "#ffe77a" : a.isCorrect ? "#b7eb8f" : "#ffa39e";
                return (
                <tr key={a.id}
                  style={{ backgroundColor: bg, borderBottom: "1px solid #e5e7eb", cursor: "pointer", transition: "background-color 0.15s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = hoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = bg)}
                >
                  <td className="px-5 py-3.5 text-center text-sm font-bold text-black">
                    {a.question?.order ?? i + 1}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-black">
                    {a.userAnswer || <span className="text-black/40">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-black">
                    {a.question?.correctAnswer ?? ""}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
