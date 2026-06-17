"use client";

import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
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
