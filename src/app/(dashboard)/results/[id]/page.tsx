"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, BarChart3, ArrowLeft, Trophy, Percent } from "lucide-react";
import { TestResult, Answer } from "@/types";
import api from "@/lib/api";

function BandGauge({ score }: { score: number }) {
  const pct = ((score - 1) / 8) * 100;
  const color = score >= 7 ? "#10b981" : score >= 5.5 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${pct * 2.512} 251.2`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold leading-none" style={{ color }}>{score}</span>
          <span className="mt-0.5 text-xs font-medium text-slate-400">Band</span>
        </div>
      </div>
      <span className="mt-2 text-xs font-semibold text-slate-500">
        {score >= 8 ? "Expert" : score >= 7 ? "Very Good" : score >= 6 ? "Competent" : score >= 5 ? "Modest" : "Limited"}
      </span>
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE_NG: "True / False / NG",
  FILL_IN_BLANK: "Fill in the Blank",
  SHORT_ANSWER: "Short Answer",
  MATCHING_HEADINGS: "Matching Headings",
  MATCHING_INFO: "Matching Paragraph",
};

function resolveDisplayAnswer(answer: string | null, question: Answer["question"]): string {
  if (!answer) return "";
  if (question?.type === "MATCHING_HEADINGS" && question.options) {
    const opts = question.options as string[];
    const match = opts.find((o) => o.startsWith(answer + " ") || o.startsWith(answer + "–") || o.startsWith(answer + " –"));
    return match ?? answer;
  }
  return answer;
}

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
  if (!result) return (
    <div className="py-20 text-center text-gray-400">Result not found.</div>
  );

  const pct = result.totalPoints > 0 ? Math.round((result.rawScore / result.totalPoints) * 100) : 0;
  const correctCount = result.answers?.filter((a: Answer) => a.isCorrect).length ?? 0;
  const wrongCount = (result.answers?.length ?? 0) - correctCount;

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-6xl px-6 py-8">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-black transition">
        <ArrowLeft className="h-4 w-4" /> Back to Results
      </button>

      {/* Summary — IELTStation style: rose-50 header, white body */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-red-100 bg-gray-50 px-8 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-black mb-1">IELTS READING · RESULTS</p>
          <h1 className="text-lg font-extrabold text-black">{result.test?.title}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-around gap-6 p-8">
          {result.bandScore && <BandGauge score={result.bandScore} />}
          {[
            { label: "Correct", value: `${result.rawScore}/${result.totalPoints}`, icon: BarChart3, color: "bg-gray-50 text-black" },
            { label: "Accuracy", value: `${pct}%`, icon: Percent, color: "bg-green-50 text-green-600" },
            { label: "Time Spent", value: result.timeSpent ? `${Math.round(result.timeSpent / 60)} min` : "—", icon: Clock, color: "bg-amber-50 text-amber-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex flex-col items-center">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-black">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Correct/wrong bar */}
        <div className="px-8 pb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <span className="text-green-600 font-semibold">{correctCount} correct</span>
            <span>·</span>
            <span className="text-black font-semibold">{wrongCount} incorrect</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div className="bg-green-500" style={{ width: `${pct}%` }} />
            <div className="bg-red-300" style={{ width: `${100 - pct}%` }} />
          </div>
        </div>
      </div>

      {/* Answer review */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 font-extrabold text-black">Answer Review</h2>
        <div className="space-y-3">
          {result.answers?.map((a: Answer) => (
            <div key={a.id} className={`rounded-xl border p-4 ${a.isCorrect ? "border-green-100 bg-green-50/50" : "border-red-100 bg-gray-50/50"}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {a.isCorrect
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <XCircle className="h-5 w-5 text-black" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">
                      {a.question?.passage?.order ? `Part ${a.question.passage.order}` : ""} · Q{a.question?.order}
                    </span>
                    <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-xs text-gray-400">
                      {TYPE_LABELS[a.question?.type ?? ""] ?? a.question?.type}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-black leading-relaxed">{a.question?.questionText}</p>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className={`rounded-lg p-2.5 ${a.isCorrect ? "bg-green-100/60" : "bg-gray-100/60"}`}>
                      <span className="block text-xs text-gray-400 mb-0.5">Your answer</span>
                      <span className={`font-semibold ${a.isCorrect ? "text-green-700" : "text-black"}`}>
                        {a.userAnswer ? resolveDisplayAnswer(a.userAnswer, a.question) : <em className="font-normal text-gray-400">No answer</em>}
                      </span>
                    </div>
                    {!a.isCorrect && (
                      <div className="rounded-lg bg-green-100/60 p-2.5">
                        <span className="block text-xs text-gray-400 mb-0.5">Correct answer</span>
                        <span className="font-semibold text-green-700">
                          {resolveDisplayAnswer(a.question?.correctAnswer ?? null, a.question)}
                        </span>
                      </div>
                    )}
                  </div>
                  {a.question?.explanation && (
                    <div className="mt-3 rounded-lg border border-gray-100 bg-white p-3 text-xs text-gray-600">
                      <span className="font-semibold text-black">Explanation: </span>{a.question.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}
