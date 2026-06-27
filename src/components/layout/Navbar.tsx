"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, BookOpen, Headphones, PenLine, Mic, BarChart3, Shield, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const SKILL_ITEMS = [
  { href: "/reading", label: "Reading",   icon: BookOpen,    active: true  },
  { href: "/listening", label: "Listening", icon: Headphones, active: false },
  { href: "/writing",   label: "Writing",   icon: PenLine,    active: false },
  { href: "/speaking",  label: "Speaking",  icon: Mic,        active: false },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") ||
    // map old /tests path to /reading
    (href === "/reading" && (pathname === "/tests" || pathname.startsWith("/tests/")));

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-black text-[15px] leading-tight">
            Real IELTS<br />
            <span className="text-red-500 text-[11px] font-bold tracking-widest uppercase">Prep</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`relative flex items-center gap-1.5 px-3 py-5 text-sm font-medium transition-colors ${
              pathname === "/dashboard" ? "text-black" : "text-gray-400 hover:text-black"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
            {pathname === "/dashboard" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
            )}
          </Link>

          {/* Divider */}
          <div className="mx-2 h-5 w-px bg-gray-100" />

          {/* 4 skills */}
          {SKILL_ITEMS.map(({ href, label, icon: Icon, active }) => {
            const active_ = isActive(href);
            return (
              <Link
                key={href}
                href={active ? href : "#"}
                className={`relative flex items-center gap-1.5 px-3 py-5 text-sm font-medium transition-colors ${
                  !active
                    ? "text-gray-300 cursor-default"
                    : active_
                    ? "text-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {!active && (
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 ml-0.5">
                    soon
                  </span>
                )}
                {active_ && active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="mx-2 h-5 w-px bg-gray-100" />

          {/* Results */}
          <Link
            href="/results"
            className={`relative flex items-center gap-1.5 px-3 py-5 text-sm font-medium transition-colors ${
              isActive("/results") ? "text-black" : "text-gray-500 hover:text-black"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            My Results
            {isActive("/results") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
            )}
          </Link>

          {/* Admin */}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin/tests"
              className={`relative flex items-center gap-1.5 px-3 py-5 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin") ? "text-black" : "text-gray-500 hover:text-black"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
              {isActive("/admin") && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
              )}
            </Link>
          )}
        </div>

        {/* User menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 font-medium text-black hover:bg-gray-50 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="max-w-24 truncate text-sm">{user?.name}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-gray-100 bg-white py-1 shadow-xl">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-xs font-bold text-black truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                {user?.tariff === "ERKATOY" && (
                  <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-600">Erkatoy</span>
                )}
              </div>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-black hover:bg-gray-50 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
