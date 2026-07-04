"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

interface BusinessType {
  id: string;
  name: string;
}

interface WorkspaceContextType {
  workspace: string;
  businessTypes: BusinessType[];
  setWorkspace: (value: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState("all");
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("kaekae_workspace");
    if (saved) setWorkspaceState(saved);

    loadBusinessTypes();
  }, []);

  async function loadBusinessTypes() {
    const { data } = await supabase
      .from("business_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (data) setBusinessTypes(data);
  }

  function setWorkspace(value: string) {
    setWorkspaceState(value);
    localStorage.setItem("kaekae_workspace", value);
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        businessTypes,
        setWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace harus digunakan di dalam WorkspaceProvider");
  }

  return context;
}