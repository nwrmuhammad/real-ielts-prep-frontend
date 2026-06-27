"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen, Headphones, PenLine, Mic, User, Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const PERKS = [
  "Practice all 4 IELTS skills in one place",
  "Full-length timed tests in real exam conditions",
  "Instant band score after every test",
  "Track your progress and spot weak areas",
];

const SKILLS = [
  { icon: BookOpen,   label: "Reading",   color: "bg-red-100 text-red-500",     live: true  },
  { icon: Headphones, label: "Listening", color: "bg-blue-100 text-blue-500",   live: false },
  { icon: PenLine,    label: "Writing",   color: "bg-amber-100 text-amber-500", live: false },
  { icon: Mic,        label: "Speaking",  color: "bg-purple-100 text-purple-500", live: false },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created! Welcome!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
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
            Your IELTS journey<br />starts here.
          </h2>
          <p className="mb-8 text-gray-500 leading-relaxed">
            Join thousands of students practising with Real IELTS Prep —
            the platform built for exam success.
          </p>

          <div className="space-y-3 mb-8">
            {PERKS.map((p) => (
              <div key={p} className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                <span className="text-sm text-gray-600">{p}</span>
              </div>
            ))}
          </div>

          {/* Skills preview */}
          <div className="grid grid-cols-2 gap-2">
            {SKILLS.map(({ icon: Icon, label, color, live }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl bg-white border border-gray-100 px-3 py-2.5 shadow-sm">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-black">{label}</p>
                  <p className={`text-[9px] font-bold ${live ? "text-green-500" : "text-gray-300"}`}>
                    {live ? "● Live" : "Coming soon"}
                  </p>
                </div>
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

          <h1 className="mb-1 text-2xl font-extrabold text-black">Create account</h1>
          <p className="mb-8 text-sm text-gray-500">Free forever. No credit card needed.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Full name",        key: "name",     type: "text",     icon: User, placeholder: "John Smith" },
              { label: "Email address",    key: "email",    type: "email",    icon: Mail, placeholder: "you@example.com" },
              { label: "Password",         key: "password", type: "password", icon: Lock, placeholder: "Min. 6 characters" },
              { label: "Confirm password", key: "confirm",  type: "password", icon: Lock, placeholder: "Repeat your password" },
            ].map(({ label, key, type, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-medium text-black">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={type} required value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 transition shadow-sm"
            >
              {loading ? "Creating account…" : <><span>Create free account</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-black hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
