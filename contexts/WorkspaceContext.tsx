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

interface Company {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
}

interface WorkspaceContextType {
  workspace: string;
  businessTypes: BusinessType[];
  setWorkspace: (value: string) => void;

  company: string;
  companies: Company[];
  setCompany: (value: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState("all");
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  const [company, setCompanyState] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const savedWorkspace = localStorage.getItem("kaekae_workspace");
    if (savedWorkspace) setWorkspaceState(savedWorkspace);

    const savedCompany = localStorage.getItem("kaekae_company");
    if (savedCompany) setCompanyState(savedCompany);

    loadMasterSelectors();
  }, []);

  async function loadMasterSelectors() {
    const [businessResult, companyResult] = await Promise.all([
      supabase
        .from("business_types")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("companies")
        .select("id, code, name, tagline")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (businessResult.data) {
      setBusinessTypes(businessResult.data);
    }

    if (companyResult.data) {
      setCompanies(companyResult.data);

      const savedCompany = localStorage.getItem("kaekae_company");
      const savedStillExists = companyResult.data.some(
        (item) => item.id === savedCompany
      );

      if (!savedStillExists && companyResult.data.length > 0) {
        const defaultCompanyId = companyResult.data[0].id;
        setCompanyState(defaultCompanyId);
        localStorage.setItem("kaekae_company", defaultCompanyId);
      }
    }
  }

  function setWorkspace(value: string) {
    setWorkspaceState(value);
    localStorage.setItem("kaekae_workspace", value);
  }

  function setCompany(value: string) {
    setCompanyState(value);
    localStorage.setItem("kaekae_company", value);
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        businessTypes,
        setWorkspace,
        company,
        companies,
        setCompany,
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
