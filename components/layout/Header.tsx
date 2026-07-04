"use client";

import { Bell, Menu, UserCircle } from "lucide-react";
import WorkspaceSelector from "./WorkspaceSelector";

export default function Header({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 md:px-6 lg:px-8">
      <div className="min-h-20 py-3 flex items-center justify-between gap-4">
        {/* Kiri */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Buka menu"
            onClick={onMenuClick}
            className="lg:hidden w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition shrink-0"
          >
            <Menu size={22} />
          </button>

          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate">
              Halo, Zea 👋
            </h2>

            <p className="text-xs md:text-sm text-slate-500 truncate">
              {today}
            </p>
          </div>
        </div>

        {/* Kanan */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden sm:block">
            <WorkspaceSelector />
          </div>

          <button className="hidden md:flex w-11 h-11 rounded-2xl bg-slate-100 items-center justify-center hover:bg-slate-200 transition">
            <Bell size={20} />
          </button>

          <div className="flex items-center gap-3 bg-slate-100 px-3 md:px-4 py-2 rounded-2xl">
            <UserCircle size={26} />

            <div className="hidden md:block">
              <p className="text-sm font-semibold">Zea</p>
              <p className="text-xs text-slate-500">Owner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace mobile */}
      <div className="sm:hidden pb-3">
        <WorkspaceSelector />
      </div>
    </header>
  );
}
