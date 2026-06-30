"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { BookOpen, Clock, TrendingUp, ArrowRight, CheckCircle, Target, ChevronRight, Headphones } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TestResult } from "@/types";
import api from "@/lib/api";

/* ── Count-up hook ─────────────────────────────────── */
function useCountUp(target: number, duration = 900, start = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) { setValue(target); return; }
    const step = target / (duration / 16);
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + step, target);
      setValue(Math.round(cur * 10) / 10);
      if (cur >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration, start]);
  return value;
}

/* ── Band badge ────────────────────────────────────── */
function BandBadge({ score }: { score: number }) {
  const color = score >= 7 ? "bg-green-100 text-green-700" :
                score >= 5.5 ? "bg-amber-100 text-amber-700" :
                "bg-gray-100 text-black";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${color}`}>
      Band {score}
    </span>
  );
}

/* ── Stat card with count-up ───────────────────────── */
function StatCard({
  label, rawValue, icon: Icon, color, sub, delay, suffix = "", isFloat = false
}: {
  label: string; rawValue: number; icon: any; color: string; sub?: string;
  delay: number; suffix?: string; isFloat?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const count = useCountUp(rawValue, 800, visible);
  const display = isFloat ? count.toFixed(1) : Math.round(count).toString();

  return (
    <div
      ref={ref}
      className="animate-fade-up rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-extrabold text-black">{rawValue === 0 ? "—" : display + suffix}</div>
      <div className="mt-0.5 text-sm text-gray-500">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/results/my").then((r) => setResults(r.data)).finally(() => setLoading(false));
  }, []);

  const completed = results.filter((r) => r.bandScore);
  const avgBandNum = completed.length
    ? Math.round((completed.reduce((s, r) => s + (r.bandScore ?? 0), 0) / completed.length) * 10) / 10
    : 0;
  const bestBand = completed.length ? Math.max(...completed.map((r) => r.bandScore ?? 0)) : 0;
  const totalMinutes = results.reduce((s, r) => s + Math.round((r.timeSpent ?? 0) / 60), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const avgBandDisplay = avgBandNum > 0 ? avgBandNum.toFixed(1) : "—";

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 py-5 sm:py-8">

      {/* Hero ─ rose-50 with floating score card */}
      <div className="animate-fade-up delay-0 mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-50 p-5 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-black">
              REAL IELTS PREP
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black">
              {greeting},{" "}
              <span className="relative inline-block">
                {user?.name?.split(" ")[0]}
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gray-600" />
              </span>
              !
            </h1>
            <p className="mt-3 max-w-md text-gray-500">
              {completed.length > 0
                ? `You've completed ${completed.length} test${completed.length > 1 ? "s" : ""}. Average band score: ${avgBandDisplay}. Keep practising!`
                : "Start your first IELTS Reading practice test and track your band score."}
            </p>
            <Link
              href="/reading"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-600 hover:gap-3 transition-all shadow-sm"
            >
              Start Practising <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Floating score card */}
          <div className="animate-float hidden sm:block">
            <div className="relative rounded-2xl border border-red-200 bg-white p-5 min-w-48 shadow-md overflow-hidden">
              {/* shimmer overlay */}
              <div className="pointer-events-none absolute inset-0 animate-shimmer rounded-2xl" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Band</p>
              <p className="mt-1 text-5xl font-extrabold text-black">{avgBandDisplay}</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-1000"
                  style={{ width: avgBandNum > 0 ? `${((avgBandNum - 1) / 8) * 100}%` : "0%" }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">IELTS scale 1–9</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills modules */}
      <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-2">
        {[
          { icon: BookOpen,   label: "Reading",   sub: "Practice now",   color: "bg-red-50",  fg: "text-red-500",  href: "/reading", live: true  },
          { icon: Headphones, label: "Listening", sub: "Coming soon",    color: "bg-blue-50", fg: "text-blue-400", href: null,       live: false },
        ].map(({ icon: Icon, label, sub, color, fg, href, live }) => (
          href ? (
            <Link key={label} href={href}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className={`h-5 w-5 ${fg}`} />
              </div>
              <div>
                <p className="font-bold text-black text-sm">{label}</p>
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" /> {sub}
                </p>
              </div>
            </Link>
          ) : (
            <div key={label}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 opacity-50">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className={`h-5 w-5 ${fg}`} />
              </div>
              <div>
                <p className="font-bold text-black text-sm">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Stat cards ─ count-up + staggered fade */}
      <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tests Completed" rawValue={completed.length} icon={BookOpen} color="bg-gray-50 text-black" delay={0} />
        <StatCard label="Average Band" rawValue={avgBandNum} icon={TrendingUp} color="bg-green-50 text-green-600" sub="IELTS scale 1–9" delay={80} isFloat suffix="" />
        <StatCard label="Best Band" rawValue={bestBand} icon={Target} color="bg-amber-50 text-amber-500" delay={160} />
        <StatCard
          label="Study Time"
          rawValue={totalMinutes}
          icon={Clock}
          color="bg-blue-50 text-blue-500"
          delay={240}
          suffix="m"
        />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Recent results */}
        <div className="lg:col-span-2 animate-fade-up delay-300">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
              <h2 className="font-bold text-black">Recent Results</h2>
              <Link href="/results" className="flex items-center gap-1 text-sm font-medium text-black hover:underline">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-50" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="mx-auto mb-3 h-10 w-10 text-red-100" />
                  <p className="text-sm text-gray-400">No tests taken yet.</p>
                  <Link href="/tests" className="mt-2 inline-block text-sm font-medium text-black hover:underline">
                    Browse tests →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.slice(0, 5).map((r, i) => (
                    <Link
                      key={r.id}
                      href={`/results/${r.id}`}
                      className="group flex items-center justify-between rounded-xl px-4 py-3 hover:bg-gray-50 transition"
                      style={{ animationDelay: `${350 + i * 60}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 group-hover:scale-110 transition-transform">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-black">{r.test?.title}</p>
                          <p className="text-xs text-gray-400">
                            {r.submittedAt
                              ? new Date(r.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : ""}
                            {r.timeSpent ? ` · ${Math.round(r.timeSpent / 60)} min` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">{r.rawScore}/{r.totalPoints}</span>
                        {r.bandScore ? <BandBadge score={r.bandScore} /> : null}
                        <ChevronRight className="h-4 w-4 text-red-200 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick tip */}
          <div className="animate-fade-up delay-500 rounded-2xl bg-gray-50 p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-black">Reading Tip</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Select text in the passage to highlight it in{" "}
              <span className="rounded px-1 font-semibold" style={{ backgroundColor: "#FEF08A" }}>yellow</span>,{" "}
              <span className="rounded px-1 font-semibold" style={{ backgroundColor: "#86EFAC" }}>green</span>, or{" "}
              <span className="rounded px-1 font-semibold" style={{ backgroundColor: "#FCA5A5" }}>red</span>{" "}
              — just like marking a real exam paper.
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
