"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { X } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* SIDEBAR DESKTOP */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-72 z-30">
        <Sidebar />
      </div>

      {/* SIDEBAR MOBILE */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div className="relative w-72 max-w-[85vw] h-full bg-slate-950 shadow-2xl">
            <button
              type="button"
              aria-label="Tutup sidebar"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 z-10 w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center"
            >
              <X size={20} />
            </button>

            <Sidebar />
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="lg:pl-72 min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
