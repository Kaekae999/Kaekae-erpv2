"use client";

import { BriefcaseBusiness } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function WorkspaceSelector() {
  const { workspace, businessTypes, setWorkspace } = useWorkspace();

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
      <BriefcaseBusiness size={18} className="text-slate-500" />

      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          Workspace
        </p>

        <select
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value)}
          className="bg-transparent outline-none font-semibold text-slate-800"
        >
          <option value="all">Semua Usaha</option>

          {businessTypes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}