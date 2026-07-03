"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Check, Camera, Crown, BookOpen, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

function Field({
  label, description, children,
}: {
  label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-8 py-5 border-b border-gray-100 last:border-0">
      <div className="sm:w-44 shrink-0">
        <p className="text-sm font-medium text-black">{label}</p>
        {description && <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: React.ReactNode }) {
  const { suffix, className, ...rest } = props;
  return (
    <div className="relative">
      <input
        {...rest}
        className={`w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm text-black placeholder:text-gray-300 outline-none focus:border-gray-400 transition ${className ?? ""}`}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [showC, setShowC] = useState(false);
  const [showN, setShowN] = useState(false);

  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg,     setInfoMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwMsg,       setPwMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email); }
  }, [user]);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, string> = {};
    if (name.trim() && name.trim() !== user?.name)   payload.name  = name.trim();
    if (email.trim() && email.trim() !== user?.email) payload.email = email.trim();
    if (!Object.keys(payload).length) { setInfoMsg({ ok: false, text: "Hech narsa o'zgartirilmadi" }); return; }
    setInfoLoading(true); setInfoMsg(null);
    try {
      await api.patch("/auth/me", payload);
      setInfoMsg({ ok: true, text: "Saqlandi" });
    } catch (err: any) {
      setInfoMsg({ ok: false, text: err.response?.data?.message ?? "Xatolik" });
    } finally { setInfoLoading(false); }
  }

  async function savePw(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPw || !newPw) { setPwMsg({ ok: false, text: "Ikkala maydonni to'ldiring" }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      await api.patch("/auth/me", { currentPassword: currentPw, newPassword: newPw });
      setPwMsg({ ok: true, text: "Parol yangilandi" });
      setCurrentPw(""); setNewPw("");
    } catch (err: any) {
      setPwMsg({ ok: false, text: err.response?.data?.message ?? "Xatolik" });
    } finally { setPwLoading(false); }
  }

  const initials = user?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "";
  const joined   = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;

  const daysLeft = user?.tariffExpiresAt
    ? Math.max(0, Math.ceil((new Date(user.tariffExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const PLANS = {
    XAVASKOR: { label: "Free",  icon: BookOpen, color: "text-gray-600",  bg: "bg-gray-50",    border: "border-gray-200", desc: "10 ta bepul practice test" },
    AMATEUR:  { label: "Lite",  icon: Zap,      color: "text-blue-600",  bg: "bg-blue-50",    border: "border-blue-200", desc: "Barcha IELTS Volume testlar" },
    ERKATOY:  { label: "Pro",   icon: Crown,    color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", desc: "Volume + Predicted testlar" },
  } as const;
  const plan = PLANS[(user?.tariff ?? "XAVASKOR") as keyof typeof PLANS];

  return (
    <div className="h-full overflow-y-auto bg-gray-50/60">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-14">

        {/* Page title */}
        <h1 className="mb-8 text-2xl font-extrabold tracking-tight text-black">Account</h1>

        {/* Avatar + meta */}
        <div className="mb-6 flex items-center gap-5">
          <div className="relative group">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-black text-2xl font-extrabold text-white select-none">
              {initials}
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition cursor-pointer">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-black">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${plan.bg} ${plan.color}`}>{plan.label}</span>
              {joined && <span className="text-xs text-gray-400">· Joined {joined}</span>}
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className={`mb-4 rounded-2xl border ${plan.border} ${plan.bg} px-5 sm:px-6 shadow-sm`}>
          <div className="flex items-center justify-between py-4 border-b border-gray-100/60">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Subscription</p>
            <a href="https://t.me/nvrmuhammad" target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-500 hover:underline">
              Upgrade →
            </a>
          </div>
          <div className="flex items-center gap-4 py-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${plan.border} bg-white`}>
              <plan.icon className={`h-5 w-5 ${plan.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-bold text-base ${plan.color}`}>{plan.label} Plan</p>
                {daysLeft !== null && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${daysLeft <= 5 ? "bg-red-100 text-red-600" : "bg-white/70 text-gray-500"}`}>
                    {daysLeft} kun qoldi
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{plan.desc}</p>
            </div>
          </div>
          {user?.tariff === "XAVASKOR" && (
            <div className="pb-4 grid grid-cols-2 gap-2">
              <a href="https://t.me/nvrmuhammad" target="_blank" rel="noopener noreferrer"
                className="flex flex-col rounded-xl border border-blue-200 bg-white px-3 py-2.5 hover:shadow-sm transition">
                <span className="text-xs font-bold text-blue-600">Lite — 50,000 so'm</span>
                <span className="text-xs text-gray-400 mt-0.5">Volume testlar · 30 kun</span>
              </a>
              <a href="https://t.me/nvrmuhammad" target="_blank" rel="noopener noreferrer"
                className="flex flex-col rounded-xl border border-purple-200 bg-white px-3 py-2.5 hover:shadow-sm transition">
                <span className="text-xs font-bold text-purple-600">Pro — 150,000 so'm</span>
                <span className="text-xs text-gray-400 mt-0.5">Volume + Predicted · 30 kun</span>
              </a>
            </div>
          )}
        </div>

        {/* Personal info */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-5 sm:px-6 shadow-sm">
          <div className="border-b border-gray-100 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Personal info</p>
          </div>

          <form onSubmit={saveInfo}>
            <Field label="Full name">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
            </Field>

            <Field label="Email" description="Used to sign in to your account">
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </Field>

            <div className="flex items-center justify-between py-4">
              {infoMsg ? (
                <p className={`flex items-center gap-1.5 text-sm ${infoMsg.ok ? "text-green-600" : "text-red-500"}`}>
                  {infoMsg.ok && <Check className="h-3.5 w-3.5" />}
                  {infoMsg.text}
                </p>
              ) : <span />}
              <button
                type="submit"
                disabled={infoLoading}
                className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40 transition"
              >
                {infoLoading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>

        {/* Password */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-5 sm:px-6 shadow-sm">
          <div className="border-b border-gray-100 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Password</p>
          </div>

          <form onSubmit={savePw}>
            <Field label="Current password">
              <Input
                type={showC ? "text" : "password"}
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                suffix={
                  <button type="button" onClick={() => setShowC(!showC)} className="text-gray-300 hover:text-gray-600 transition">
                    {showC ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </Field>

            <Field label="New password" description="Minimum 6 characters">
              <Input
                type={showN ? "text" : "password"}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="••••••••"
                suffix={
                  <button type="button" onClick={() => setShowN(!showN)} className="text-gray-300 hover:text-gray-600 transition">
                    {showN ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </Field>

            <div className="flex items-center justify-between py-4">
              {pwMsg ? (
                <p className={`flex items-center gap-1.5 text-sm ${pwMsg.ok ? "text-green-600" : "text-red-500"}`}>
                  {pwMsg.ok && <Check className="h-3.5 w-3.5" />}
                  {pwMsg.text}
                </p>
              ) : <span />}
              <button
                type="submit"
                disabled={pwLoading}
                className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40 transition"
              >
                {pwLoading ? "Saving…" : "Update password"}
              </button>
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-gray-200 bg-white px-5 sm:px-6 shadow-sm">
          <div className="border-b border-gray-100 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Session</p>
          </div>
          <div className="flex items-center justify-between py-5">
            <div>
              <p className="text-sm font-medium text-black">Sign out</p>
              <p className="text-xs text-gray-400">Sign out from this device</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition"
            >
              Sign out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
