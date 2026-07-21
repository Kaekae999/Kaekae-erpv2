"use client";

import { Building2 } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function CompanySelector() {
  const { company, companies, setCompany } = useWorkspace();

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
      <Building2 size={18} className="text-slate-500 shrink-0" />

      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          Perusahaan
        </p>

        <select
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className="bg-transparent outline-none font-semibold text-slate-800 max-w-44"
        >
          {companies.length === 0 && (
            <option value="">Belum ada perusahaan</option>
          )}

          {companies.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
