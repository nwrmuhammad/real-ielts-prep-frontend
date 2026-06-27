"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { GraduationCap, BookOpen, Users, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/admin/tests", label: "Tests", icon: BookOpen },
  { href: "/admin/users", label: "Users", icon: Users    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
    else if (!loading && user?.role !== "ADMIN") router.replace("/admin/login");
  }, [user, loading, router]);

  if (loading || user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 shrink-0">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold text-black">Real IELTS</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">Admin</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-red-50 text-red-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-red-300" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — user + sign out */}
        <div className="border-t border-gray-100 px-3 py-4 space-y-0.5">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-black transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
          <div className="mt-1 flex items-center gap-2.5 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-black">{user.name}</p>
              <p className="truncate text-[10px] text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
