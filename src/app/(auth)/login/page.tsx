"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen, Headphones, PenLine, Mic, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const SKILLS = [
  { icon: BookOpen,    label: "Reading",   color: "bg-red-100 text-red-500",    live: true  },
  { icon: Headphones,  label: "Listening", color: "bg-blue-100 text-blue-500",   live: false },
  { icon: PenLine,     label: "Writing",   color: "bg-amber-100 text-amber-500", live: false },
  { icon: Mic,         label: "Speaking",  color: "bg-purple-100 text-purple-500", live: false },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-gray-50 px-12 lg:flex">
        <div className="max-w-sm w-full">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 shadow-sm shadow-red-200">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold text-black">Real IELTS</div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-red-500">Prep</div>
            </div>
          </div>

          <h2 className="mb-3 text-3xl font-extrabold text-black leading-tight">
            Master all 4<br />IELTS skills.
          </h2>
          <p className="mb-8 text-gray-500 leading-relaxed">
            Practice Reading, Listening, Writing, and Speaking in real exam conditions.
            Track your band score and improve faster.
          </p>

          {/* 4 skills grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {SKILLS.map(({ icon: Icon, label, color, live }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">{label}</p>
                  <p className={`text-[10px] font-bold ${live ? "text-green-500" : "text-gray-300"}`}>
                    {live ? "● Live" : "Coming soon"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 divide-x divide-gray-200 rounded-2xl border border-gray-200 bg-white text-center">
            {[["4", "Skills"], ["9.0", "Max band"], ["Free", "Forever"]].map(([v, l]) => (
              <div key={l} className="py-4">
                <div className="text-xl font-extrabold text-black">{v}</div>
                <div className="text-xs text-gray-400">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold text-black">Real IELTS</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">Prep</div>
            </div>
          </div>

          <h1 className="mb-1 text-2xl font-extrabold text-black">Sign in</h1>
          <p className="mb-8 text-sm text-gray-500">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password" required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 transition shadow-sm"
            >
              {loading ? "Signing in…" : <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-black hover:underline">Create one free</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
