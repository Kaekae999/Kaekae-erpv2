"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Package,
  Users,
  UserRound,
  BarChart3,
  Settings,
  Tags,
  Ruler,
  Warehouse,
  Archive,
  BriefcaseBusiness,
  FileText,
  Building2,
  CreditCard,
  WalletCards,
  ReceiptText,
  Banknote,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const menuGroups = [
  {
    key: "dashboard",
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "master",
    name: "MASTER DATA",
    basePaths: ["/master", "/inventory"],
    items: [
      { name: "Unit Bisnis", href: "/master/unit-bisnis", icon: BriefcaseBusiness },
      { name: "Produk", href: "/master/produk", icon: Package },
      { name: "Kategori", href: "/master/kategori", icon: Tags },
      { name: "Satuan", href: "/master/satuan", icon: Ruler },
      { name: "Gudang", href: "/master/gudang", icon: Warehouse },
      { name: "Inventory", href: "/inventory", icon: Archive },
      { name: "Supplier", href: "/master/supplier", icon: Users },
      { name: "Customer", href: "/master/customer", icon: UserRound },
      { name: "Rekening Bank", href: "/master/rekening-bank", icon: CreditCard },
    ],
  },
  {
    key: "transaksi",
    name: "TRANSAKSI",
    basePaths: ["/transaksi"],
    items: [
      { name: "Pembelian", href: "/transaksi/pembelian", icon: ShoppingCart },
      { name: "Penjualan", href: "/transaksi/penjualan", icon: ShoppingCart },
      { name: "Produksi", href: "/transaksi/produksi", icon: Factory },
    ],
  },
  {
    key: "keuangan",
    name: "KEUANGAN",
    basePaths: ["/keuangan"],
    items: [
      { name: "Beban Usaha", href: "/keuangan/beban-usaha", icon: ReceiptText },
      { name: "Transaksi Kas", href: "/keuangan/transaksi-kas", icon: WalletCards },
      { name: "Pembagian Laba", href: "/keuangan/pembagian-laba", icon: WalletCards },
    ],
  },
  {
    key: "dokumen",
    name: "DOKUMEN",
    basePaths: ["/dokumen"],
    items: [
      { name: "Invoice", href: "/dokumen/invoice", icon: FileText },
    ],
  },
  {
    key: "laporan",
    name: "LAPORAN",
    basePaths: ["/laporan"],
    items: [
      { name: "Laba Rugi", href: "/laporan", icon: BarChart3, exact: true },
      { name: "Penjualan", href: "/laporan/penjualan", icon: ShoppingCart },
      { name: "Pembelian", href: "/laporan/pembelian", icon: ShoppingCart },
      { name: "Arus Kas", href: "/laporan/arus-kas", icon: Banknote },
    ],
  },
  {
    key: "sistem",
    name: "SISTEM",
    basePaths: ["/pengaturan"],
    items: [
      { name: "Profil Perusahaan", href: "/pengaturan/profil", icon: Building2 },
      { name: "Pengaturan", href: "/pengaturan", icon: Settings, exact: true },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data } = await supabase
      .from("company_profiles")
      .select("company_name, logo_url")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    setProfile(data);
  }

  function getInitialOpenGroups() {
    const open: Record<string, boolean> = {};

    menuGroups.forEach((group: any) => {
      if (group.href) return;

      open[group.key] = group.basePaths?.some((path: string) => {
        if (path === "/laporan") {
          return pathname === "/laporan" || pathname.startsWith("/laporan/");
        }

        if (path === "/pengaturan") {
          return pathname === "/pengaturan" || pathname.startsWith("/pengaturan/");
        }

        return pathname === path || pathname.startsWith(path + "/");
      });
    });

    return open;
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    getInitialOpenGroups
  );

  useEffect(() => {
    setOpenGroups((prev) => ({
      ...prev,
      ...getInitialOpenGroups(),
    }));
  }, [pathname]);

  function toggleGroup(key: string) {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function isActive(item: any) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  const logoSrc = profile?.logo_url || "/logo/kaekae.png";

  return (
    <aside className="w-72 min-h-screen bg-slate-950 text-white p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden p-1.5 shrink-0">
          <img
            src={logoSrc}
            alt="Logo Kaekae"
            className="w-full h-full object-contain"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              const parent = event.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML =
                  '<span style="font-weight:900;color:#f59e0b;font-size:24px;">K</span>';
              }
            }}
          />
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">
            {profile?.company_name || "Kaekae"}
          </h1>

          <p className="text-xs text-slate-400 truncate">
            Business Operating System
          </p>
        </div>
      </div>

      <nav className="space-y-2">
        {menuGroups.map((group: any) => {
          if (group.href) {
            const Icon = group.icon;
            const active = pathname === group.href;

            return (
              <Link
                key={group.key}
                href={group.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-amber-400 text-slate-950 font-semibold shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span>{group.name}</span>
              </Link>
            );
          }

          const isOpen = openGroups[group.key];

          return (
            <div key={group.key} className="rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                  isOpen
                    ? "bg-slate-900 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <span className="text-[11px] uppercase tracking-[0.2em] font-bold">
                  {group.name}
                </span>

                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isOpen && (
                <div className="mt-1 ml-2 space-y-1 border-l border-slate-800 pl-3">
                  {group.items.map((item: any) => {
                    const Icon = item.icon;
                    const active = isActive(item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                          active
                            ? "bg-amber-400 text-slate-950 font-semibold shadow-lg"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
