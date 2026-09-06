"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/boards");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
        <p className="text-sm font-medium text-gray-500">Loading Mini Kanban...</p>
      </div>
    </main>
  );
}
