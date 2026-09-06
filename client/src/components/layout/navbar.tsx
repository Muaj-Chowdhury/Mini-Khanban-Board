"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Hide navbar on auth pages if desired, or show simplified version
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  const displayName = user?.name || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/boards" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black font-extrabold text-white shadow-sm transition-transform group-hover:scale-105">
              MK
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Mini Kanban
            </span>
          </Link>

          {user && (
            <div className="hidden sm:flex sm:space-x-4">
              <Link
                href="/boards"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/boards")
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Boards
              </Link>
            </div>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white shadow-inner">
                {initial}
              </div>
              <span className="hidden text-sm font-medium text-gray-700 md:inline-block">
                {user.email}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-black px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
