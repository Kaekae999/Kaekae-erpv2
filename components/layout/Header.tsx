"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Menu, UserCircle } from "lucide-react";
import WorkspaceSelector from "./WorkspaceSelector";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface ProfitNotification {
  businessTypeId: string;
  businessName: string;
  month: number;
  year: number;
  netProfit: number;
  distributed: number;
  remaining: number;
}

export default function Header({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const { workspace } = useWorkspace();

  const [today, setToday] = useState("");
  const [notifications, setNotifications] = useState<ProfitNotification[]>([]);
  const [openNotif, setOpenNotif] = useState(false);

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    loadProfitNotifications();
  }, [workspace]);

  async function loadProfitNotifications() {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

      const businessResult = await supabase
        .from("business_types")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (businessResult.error) throw new Error(businessResult.error.message);

      let businessTypes = businessResult.data || [];

      if (workspace !== "all") {
        businessTypes = businessTypes.filter((item) => item.id === workspace);
      }

      const result: ProfitNotification[] = [];

      for (const business of businessTypes) {
        const { data: salesData, error: salesError } = await supabase
          .from("sales_details")
          .select(`
            subtotal,
            total_cost,
            sales_headers!inner(
              transaction_date,
              status
            ),
            products!inner(
              business_type_id
            )
          `)
          .eq("products.business_type_id", business.id)
          .gte("sales_headers.transaction_date", startDate)
          .lt("sales_headers.transaction_date", endDate)
          .neq("sales_headers.status", "CANCELLED");

        if (salesError) throw new Error(salesError.message);

        const { data: expenseData, error: expenseError } = await supabase
          .from("operating_expenses")
          .select("amount")
          .eq("business_type_id", business.id)
          .gte("expense_date", startDate)
          .lt("expense_date", endDate);

        if (expenseError) throw new Error(expenseError.message);

        const { data: distributionData, error: distributionError } =
          await supabase
            .from("profit_distributions")
            .select("amount")
            .eq("business_type_id", business.id)
            .eq("period_month", month)
            .eq("period_year", year);

        if (distributionError) throw new Error(distributionError.message);

        const totalSales = (salesData || []).reduce(
          (sum: number, item: any) => sum + Number(item.subtotal || 0),
          0
        );

        const totalHpp = (salesData || []).reduce(
          (sum: number, item: any) => sum + Number(item.total_cost || 0),
          0
        );

        const totalExpenses = (expenseData || []).reduce(
          (sum: number, item: any) => sum + Number(item.amount || 0),
          0
        );

        const distributed = (distributionData || []).reduce(
          (sum: number, item: any) => sum + Number(item.amount || 0),
          0
        );

        const netProfit = totalSales - totalHpp - totalExpenses;
        const remaining = netProfit - distributed;

        if (remaining > 0) {
          result.push({
            businessTypeId: business.id,
            businessName: business.name,
            month,
            year,
            netProfit,
            distributed,
            remaining,
          });
        }
      }

      setNotifications(result);
    } catch (error) {
      console.error(
        "Gagal memuat notifikasi laba:",
        error instanceof Error ? error.message : error
      );
      setNotifications([]);
    }
  }

  const totalRemainingProfit = useMemo(() => {
    return notifications.reduce((sum, item) => sum + item.remaining, 0);
  }, [notifications]);

  const monthLabel = useMemo(() => {
    return new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 md:px-6 lg:px-8">
      <div className="min-h-20 py-3 flex items-center justify-between gap-4">
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
              {today || "-"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden sm:block">
            <WorkspaceSelector />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenNotif((prev) => !prev)}
              className="flex w-11 h-11 rounded-2xl bg-slate-100 items-center justify-center hover:bg-slate-200 transition relative"
            >
              <Bell size={20} />

              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {openNotif && (
              <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b">
                  <p className="font-black text-slate-900">
                    Notifikasi Laba
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Periode {monthLabel}
                  </p>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-5 text-sm text-slate-500">
                    Belum ada laba yang perlu dibagikan.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((item) => (
                      <Link
                        key={`${item.businessTypeId}-${item.month}-${item.year}`}
                        href="/keuangan/pembagian-laba"
                        onClick={() => setOpenNotif(false)}
                        className="block p-4 border-b hover:bg-slate-50"
                      >
                        <p className="font-bold text-slate-900">
                          {item.businessName}
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                          Laba belum dibagikan:
                        </p>

                        <p className="font-black text-emerald-700 mt-1">
                          Rp {Math.round(item.remaining).toLocaleString("id-ID")}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}

                {notifications.length > 0 && (
                  <div className="p-4 bg-slate-50">
                    <p className="text-xs text-slate-500">
                      Total belum dibagikan
                    </p>

                    <p className="font-black text-slate-900">
                      Rp {Math.round(totalRemainingProfit).toLocaleString("id-ID")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 bg-slate-100 px-3 md:px-4 py-2 rounded-2xl">
            <UserCircle size={26} />

            <div className="hidden md:block">
              <p className="text-sm font-semibold">Zea</p>
              <p className="text-xs text-slate-500">Owner</p>
            </div>
          </div>
        </div>
      </div>

      <div className="sm:hidden pb-3">
        <WorkspaceSelector />
      </div>
    </header>
  );
}
