"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Check, Camera } from "lucide-react";
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
              {user?.tariff === "ERKATOY" ? (
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-600">Erkatoy</span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">Free</span>
              )}
              {joined && <span className="text-xs text-gray-400">· Joined {joined}</span>}
            </div>
          </div>
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
