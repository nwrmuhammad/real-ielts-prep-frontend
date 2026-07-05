"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, LayoutDashboard, BookOpen, Headphones } from "lucide-react";
import { Icon3D, Icon3DName } from "@/components/ui/Icon3D";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const SKILL_ITEMS = [
  { href: "/reading",   label: "Reading",   icon: BookOpen,   active: true  },
  { href: "/listening", label: "Listening", icon: Headphones, active: false },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") ||
    (href === "/reading" && (pathname === "/tests" || pathname.startsWith("/tests/")));

  type NavItem =
    | { href: string; label: string; live: boolean; icon: React.ElementType; icon3d?: undefined }
    | { href: string; label: string; live: boolean; icon3d: Icon3DName; icon?: undefined };

  const allNav: NavItem[] = [
    { href: "/dashboard",   label: "Dashboard",  icon: LayoutDashboard, live: true  },
    { href: "/reading",     label: "Reading",    icon: BookOpen,        live: true  },
    { href: "/listening",   label: "Listening",  icon: Headphones,      live: false },
    { href: "/profile",     label: "Profil",     icon3d: "account",     live: true  },
    ...(user?.role === "ADMIN" ? [{ href: "/admin/tests", label: "Admin", icon3d: "shield" as const, live: true }] : []),
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center">
              <Icon3D name="graduation-cap" size={32} />
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-extrabold tracking-tight text-black">Real IELTS</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-red-500">Prep</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center">
            <Link href="/dashboard"
              className={`relative flex items-center gap-1.5 px-3 py-4 text-sm font-medium transition-colors ${pathname === "/dashboard" ? "text-black" : "text-gray-400 hover:text-black"}`}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
              {pathname === "/dashboard" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
            </Link>

            <div className="mx-2 h-4 w-px bg-gray-100" />

            {SKILL_ITEMS.map(({ href, label, icon: Icon, active }) => {
              const active_ = isActive(href);
              return (
                <Link key={href} href={active ? href : "#"}
                  className={`relative flex items-center gap-1.5 px-3 py-4 text-sm font-medium transition-colors ${!active ? "text-gray-300 cursor-default" : active_ ? "text-black" : "text-gray-500 hover:text-black"}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                  {!active && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 ml-0.5">soon</span>}
                  {active_ && active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
                </Link>
              );
            })}

            <div className="mx-2 h-4 w-px bg-gray-100" />

            {user?.role === "ADMIN" && (
              <Link href="/admin/tests"
                className={`relative flex items-center gap-1.5 px-3 py-4 text-sm font-medium transition-colors ${pathname.startsWith("/admin") ? "text-black" : "text-gray-500 hover:text-black"}`}>
                <Icon3D name="shield" size={18} />
                Admin
                {pathname.startsWith("/admin") && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* User dropdown — desktop */}
            <div className="relative hidden lg:block">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 font-medium text-black hover:bg-gray-50 transition">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-20 truncate text-sm">{user?.name?.split(" ")[0]}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-gray-100 bg-white py-1 shadow-xl z-50">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-xs font-bold text-black truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    {user?.tariff === "ERKATOY" && (
                      <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-600">Erkatoy</span>
                    )}
                  </div>
                  <Link href="/profile" onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-black hover:bg-gray-50 transition">
                    <Icon3D name="account" size={18} /> Profil
                  </Link>
                  <button onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-black hover:bg-gray-50 transition">
                    <Icon3D name="leave" size={18} /> Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger — mobile */}
            <button onClick={() => setMobileOpen(true)}
              className="flex lg:hidden items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Icon3D name="graduation-cap" size={32} />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-extrabold text-black">Real IELTS</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-red-500">Prep</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User info */}
            <div className="border-b border-gray-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-black">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {allNav.map((item) => {
                const { href, label, live } = item;
                const active = isActive(href) || pathname === href;
                const iconEl = item.icon3d
                  ? <Icon3D name={item.icon3d} size={20} />
                  : <item.icon className="h-4 w-4" />;
                if (!live) return (
                  <div key={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-300">
                    {iconEl} {label}
                    <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase text-gray-400">soon</span>
                  </div>
                );
                return (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${active ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-50 hover:text-black"}`}>
                    {iconEl} {label}
                  </Link>
                );
              })}
            </nav>

            {/* Sign out */}
            <div className="border-t border-gray-100 px-3 py-3">
              <button onClick={() => { setMobileOpen(false); logout(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition">
                <Icon3D name="leave" size={20} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
