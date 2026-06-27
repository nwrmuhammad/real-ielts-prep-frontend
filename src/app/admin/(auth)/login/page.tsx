"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Shield, Mail, Lock, ArrowRight, BookOpen, Users, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "ADMIN") router.replace("/admin/tests");
      else router.replace("/dashboard");
    }
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(form.email, form.password);
      if (u.role !== "ADMIN") {
        toast.error("Access denied. Admin only.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
        return;
      }
      toast.success("Welcome, admin!");
      router.replace("/admin/tests");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-gray-50 px-12 lg:flex">
        <div className="max-w-sm w-full">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 shadow-sm shadow-red-200">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold text-black">Real IELTS</div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-red-500">Prep</div>
            </div>
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-100 px-3 py-1.5">
            <Shield className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Admin access only</span>
          </div>

          <h2 className="mb-3 text-3xl font-extrabold text-black leading-tight">
            Manage your<br />platform here.
          </h2>
          <p className="mb-8 text-gray-500 leading-relaxed">
            Create and publish tests, manage users, assign tariffs, and track platform activity.
          </p>

          <div className="space-y-3">
            {[
              { icon: BookOpen, label: "Create & publish reading tests" },
              { icon: Users,    label: "Manage users and assign tariffs" },
              { icon: BarChart3, label: "View submissions and results" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                  <Icon className="h-4 w-4 text-red-500" />
                </div>
                <span className="text-sm text-gray-600">{label}</span>
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

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 border border-red-100">
            <Shield className="h-3 w-3 text-red-500" />
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Admin</span>
          </div>

          <h1 className="mb-1 mt-3 text-2xl font-extrabold text-black">Sign in</h1>
          <p className="mb-8 text-sm text-gray-500">Enter your admin credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" required autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password" required autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
            </div>
            <button
              type="submit" disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 transition shadow-sm"
            >
              {submitting ? "Signing in…" : <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Not an admin?{" "}
            <a href="/login" className="font-semibold text-gray-600 hover:text-black transition">Go to student login →</a>
          </p>
        </div>
      </div>
    </div>
  );
}
