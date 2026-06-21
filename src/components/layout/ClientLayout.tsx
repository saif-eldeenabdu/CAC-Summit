"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { useChairStore } from "@/store/chairStore";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeChairId = useChairStore((s) => s.activeChairId);

  // If on the login page, render without sidebar
  if (pathname === "/login") {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  // Auth guard: redirect to login if no active chair
  React.useEffect(() => {
    if (!activeChairId && pathname !== "/login") {
      router.push("/login");
    }
  }, [activeChairId, pathname, router]);

  if (!activeChairId) {
    return null; // Avoid flash while redirecting
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        {/* Main content area — offset for sidebar on desktop */}
        <main className="flex-1 lg:ml-[240px] pb-20 lg:pb-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
