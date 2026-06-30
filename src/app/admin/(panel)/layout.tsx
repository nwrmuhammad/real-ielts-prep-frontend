"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { GraduationCap, BookOpen, Users, LogOut, ChevronRight, Menu, X, Library, Sparkles, Shield, UserCircle } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const NAV = [
  { href: "/admin/tests",     label: "Tests",     icon: BookOpen    },
  { href: "/admin/volumes",   label: "Volumes",   icon: Library     },
  { href: "/admin/predicted", label: "Predicted", icon: Sparkles    },
  { href: "/admin/users",     label: "Users",     icon: Users       },
  { href: "/admin/admins",    label: "Adminlar",  icon: Shield      },
  { href: "/admin/profile",   label: "Profile",   icon: UserCircle  },
];

function Sidebar({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  const { user, logout } = useAdminAuth();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 shrink-0">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold text-black">Real IELTS</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">Admin</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${active ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50 hover:text-black"}`}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-red-300" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 px-3 py-4 space-y-0.5">
        <button onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-black transition-all">
          <LogOut className="h-4 w-4 shrink-0" /> Sign out
        </button>
        <Link href="/admin/profile" onClick={onClose}
          className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-gray-50 transition">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-black">{user?.name}</p>
            <p className="truncate text-[10px] text-gray-400">{user?.email}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        <Sidebar pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-white shadow-xl">
            <Sidebar pathname={pathname} onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex lg:hidden items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
          <button onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-extrabold text-black">Admin Panel</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
