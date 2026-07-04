"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Save,
  Trash2,
  Wallet,
  Users,
  UserRound,
  AlertTriangle,
} from "lucide-react";

interface BusinessType {
  id: string;
  name: string;
}

interface Recipient {
  id: string;
  name: string;
  percentage: number;
  is_mine: boolean;
  notes: string;
}

interface DistributionHistory {
  id: string;
  business_type_id: string | null;
  period_month: number;
  period_year: number;
  recipient_name: string;
  percentage: number;
  amount: number;
  is_mine: boolean;
  notes: string | null;

  business_types:
    | {
        name: string;
      }
    | null;
}

function createRecipient(): Recipient {
  return {
    id: crypto.randomUUID(),
    name: "",
    percentage: 0,
    is_mine: false,
    notes: "",
  };
}

export default function PembagianLabaPage() {
  const today = new Date();

  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [history, setHistory] = useState<DistributionHistory[]>([]);

  const [businessTypeId, setBusinessTypeId] = useState("");
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [systemNetProfit, setSystemNetProfit] = useState<number>(0);
  const [netProfit, setNetProfit] = useState<number>(0);
  const [isLoadingProfit, setIsLoadingProfit] = useState(false);

  const [recipients, setRecipients] = useState<Recipient[]>([
    createRecipient(),
  ]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBusinessTypes();
    loadHistory();
  }, []);

  useEffect(() => {
    if (businessTypeId) {
      loadSystemNetProfit();
    } else {
      setSystemNetProfit(0);
      setNetProfit(0);
    }
  }, [businessTypeId, month, year]);

  async function loadBusinessTypes() {
    const { data, error } = await supabase
      .from("business_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error(error.message);
      return;
    }

    setBusinessTypes(data || []);
  }

  async function loadHistory() {
    const { data, error } = await supabase
      .from("profit_distributions")
      .select(`
        id,
        business_type_id,
        period_month,
        period_year,
        recipient_name,
        percentage,
        amount,
        is_mine,
        notes,
        business_types(name)
      `)
      .order("period_year", {
        ascending: false,
      })
      .order("period_month", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Gagal mengambil pembagian laba:",
        error.message
      );

      return;
    }

    setHistory((data || []) as any);
  }

  async function loadSystemNetProfit() {
    if (!businessTypeId) return;

    setIsLoadingProfit(true);

    try {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

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
        .eq("products.business_type_id", businessTypeId)
        .gte("sales_headers.transaction_date", startDate)
        .lt("sales_headers.transaction_date", endDate)
        .neq("sales_headers.status", "CANCELLED");

      if (salesError) throw new Error(salesError.message);

      const { data: expenseData, error: expenseError } = await supabase
        .from("operating_expenses")
        .select("amount")
        .eq("business_type_id", businessTypeId)
        .gte("expense_date", startDate)
        .lt("expense_date", endDate);

      if (expenseError) throw new Error(expenseError.message);

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

      const calculatedNetProfit = totalSales - totalHpp - totalExpenses;

      setSystemNetProfit(calculatedNetProfit);
      setNetProfit(Math.max(0, calculatedNetProfit));
    } catch (error) {
      console.error(
        "Gagal menghitung laba bersih:",
        error instanceof Error ? error.message : error
      );
      setSystemNetProfit(0);
      setNetProfit(0);
    } finally {
      setIsLoadingProfit(false);
    }
  }

  function addRecipient() {
    setRecipients((prev) => [
      ...prev,
      createRecipient(),
    ]);
  }

  function removeRecipient(id: string) {
    if (recipients.length === 1) {
      alert("Minimal harus ada satu penerima.");
      return;
    }

    setRecipients((prev) =>
      prev.filter((item) => item.id !== id)
    );
  }

  function updateRecipient(
    id: string,
    field: keyof Recipient,
    value: string | number | boolean
  ) {
    setRecipients((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  const totalPercentage = useMemo(() => {
    return recipients.reduce(
      (sum, item) =>
        sum + Number(item.percentage || 0),
      0
    );
  }, [recipients]);

  const totalDistributed = useMemo(() => {
    return recipients.reduce((sum, item) => {
      const amount =
        netProfit *
        (Number(item.percentage || 0) / 100);

      return sum + amount;
    }, 0);
  }, [recipients, netProfit]);

  const myIncome = useMemo(() => {
    return recipients.reduce((sum, item) => {
      if (!item.is_mine) return sum;

      const amount =
        netProfit *
        (Number(item.percentage || 0) / 100);

      return sum + amount;
    }, 0);
  }, [recipients, netProfit]);

  const remainingProfit =
    netProfit - totalDistributed;

  async function handleSave() {
    if (!businessTypeId) {
      return alert("Pilih unit bisnis terlebih dahulu.");
    }

    if (netProfit <= 0) {
      return alert(
        "Laba yang dibagikan harus lebih dari Rp 0."
      );
    }

    if (netProfit > systemNetProfit) {
      return alert(
        "Laba yang dibagikan tidak boleh lebih besar dari laba bersih sistem."
      );
    }

    const invalidName = recipients.some(
      (item) => !item.name.trim()
    );

    if (invalidName) {
      return alert(
        "Nama seluruh penerima wajib diisi."
      );
    }

    if (totalPercentage <= 0) {
      return alert("Total persentase harus lebih dari 0%.");
    }

    if (totalPercentage > 100) {
      return alert(
        `Total persentase tidak boleh lebih dari 100%. Saat ini ${totalPercentage}%.`
      );
    }

    const confirmed = window.confirm(
      `Simpan pembagian laba sebesar Rp ${netProfit.toLocaleString(
        "id-ID"
      )}?`
    );

    if (!confirmed) return;

    setIsSaving(true);

    try {
      const rows = recipients.map((item) => ({
        business_type_id: businessTypeId,

        period_month: month,

        period_year: year,

        recipient_name: item.name.trim(),

        percentage: Number(
          item.percentage || 0
        ),

        amount:
          netProfit *
          (Number(item.percentage || 0) / 100),

        is_mine: item.is_mine,

        notes:
          item.notes.trim() || null,
      }));

      const { error } = await supabase
        .from("profit_distributions")
        .insert(rows);

      if (error) {
        throw new Error(error.message);
      }

      alert("Pembagian laba berhasil disimpan.");

      setNetProfit(0);

      setRecipients([
        createRecipient(),
      ]);

      await loadHistory();
    } catch (error) {
      alert(
        "Gagal menyimpan pembagian laba: " +
          (error instanceof Error
            ? error.message
            : "Error tidak diketahui")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeletePeriod(
    businessId: string | null,
    periodMonth: number,
    periodYear: number
  ) {
    const confirmed = window.confirm(
      `Hapus seluruh pembagian laba periode ${periodMonth}/${periodYear}?`
    );

    if (!confirmed) return;

    let query = supabase
      .from("profit_distributions")
      .delete()
      .eq("period_month", periodMonth)
      .eq("period_year", periodYear);

    if (businessId) {
      query = query.eq(
        "business_type_id",
        businessId
      );
    } else {
      query = query.is(
        "business_type_id",
        null
      );
    }

    const { error } = await query;

    if (error) {
      alert(
        "Gagal menghapus data: " +
          error.message
      );

      return;
    }

    alert("Pembagian laba berhasil dihapus.");

    await loadHistory();
  }

  const groupedHistory = useMemo(() => {
    const groups = new Map<
      string,
      {
        businessTypeId: string | null;
        businessName: string;
        month: number;
        year: number;
        rows: DistributionHistory[];
      }
    >();

    history.forEach((item) => {
      const key = `${item.business_type_id}-${item.period_year}-${item.period_month}`;

      if (!groups.has(key)) {
        groups.set(key, {
          businessTypeId:
            item.business_type_id,

          businessName:
            item.business_types?.name ||
            "Semua Usaha",

          month:
            item.period_month,

          year:
            item.period_year,

          rows: [],
        });
      }

      groups.get(key)?.rows.push(item);
    });

    return Array.from(groups.values());
  }, [history]);

  const totalMyHistoricalIncome = useMemo(() => {
    return history
      .filter((item) => item.is_mine)
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );
  }, [history]);

  return (
    <Layout>
      <PageHeader
        title="Pembagian Laba"
        description="Atur pembagian laba bersih secara fleksibel untuk setiap unit bisnis."
        action={
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={18} />

            {isSaving
              ? "Menyimpan..."
              : "Simpan Pembagian"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">

        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
          <Wallet
            size={26}
            className="text-slate-700"
          />

          <p className="text-sm text-slate-500 mt-4">
            Laba yang Dibagikan
          </p>

          <p className="text-xl md:text-2xl font-black mt-1">
            Rp {netProfit.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
          <Users
            size={26}
            className="text-slate-700"
          />

          <p className="text-sm text-slate-500 mt-4">
            Total Dibagikan
          </p>

          <p className="text-xl md:text-2xl font-black mt-1">
            Rp{" "}
            {Math.round(
              totalDistributed
            ).toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
          <UserRound
            size={26}
            className="text-slate-700"
          />

          <p className="text-sm text-slate-500 mt-4">
            Bagian Saya
          </p>

          <p className="text-xl md:text-2xl font-black mt-1">
            Rp{" "}
            {Math.round(myIncome).toLocaleString(
              "id-ID"
            )}
          </p>
        </div>

        <div className="bg-slate-950 text-white rounded-3xl p-4 md:p-6">
          <Wallet size={26} />

          <p className="text-sm text-slate-300 mt-4">
            Total Pendapatan Saya
          </p>

          <p className="text-xl md:text-2xl font-black mt-1">
            Rp{" "}
            {Math.round(
              totalMyHistoricalIncome
            ).toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-6">
        <h2 className="text-lg font-bold mb-5">
          Periode dan Dasar Pembagian Laba
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
          <div>
            <label className="text-sm font-semibold">
              Unit Bisnis
            </label>

            <select
              value={businessTypeId}
              onChange={(e) =>
                setBusinessTypeId(e.target.value)
              }
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            >
              <option value="">
                Pilih Unit Bisnis
              </option>

              {businessTypes.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Bulan
            </label>

            <select
              value={month}
              onChange={(e) =>
                setMonth(Number(e.target.value))
              }
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            >
              {Array.from(
                { length: 12 },
                (_, index) => index + 1
              ).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Tahun
            </label>

            <input
              type="number"
              value={year}
              onChange={(e) =>
                setYear(Number(e.target.value))
              }
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">
              Laba Bersih Sistem
            </label>

            <div className="mt-2 w-full bg-slate-100 border rounded-2xl px-4 py-3 font-bold">
              {isLoadingProfit
                ? "Menghitung..."
                : `Rp ${Math.round(systemNetProfit).toLocaleString("id-ID")}`}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Laba yang Dibagikan
            </label>

            <input
              type="number"
              min="0"
              max={Math.max(0, systemNetProfit)}
              value={netProfit || ""}
              onChange={(e) =>
                setNetProfit(
                  Number(e.target.value || 0)
                )
              }
              placeholder="Nominal yang akan dibagi"
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            />

            <p className="text-xs text-slate-500 mt-2">
              Boleh lebih kecil dari laba bersih sistem.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold">
              Penerima Pembagian Laba
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Nama dan persentase dapat berbeda
              untuk setiap usaha.
            </p>
          </div>

          <Button onClick={addRecipient}>
            <Plus size={18} />
            Tambah Penerima
          </Button>
        </div>

        <div className="space-y-4">
          {recipients.map((recipient) => {
            const amount =
              netProfit *
              (Number(
                recipient.percentage || 0
              ) /
                100);

            return (
              <div
                key={recipient.id}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.5fr_0.7fr_1fr_0.8fr_1.5fr_auto] gap-3 items-center border rounded-2xl p-4"
              >
                <input
                  value={recipient.name}
                  onChange={(e) =>
                    updateRecipient(
                      recipient.id,
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="Nama penerima"
                  className="border rounded-xl px-4 py-3 w-full"
                />

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    recipient.percentage || ""
                  }
                  onChange={(e) =>
                    updateRecipient(
                      recipient.id,
                      "percentage",
                      Number(
                        e.target.value || 0
                      )
                    )
                  }
                  placeholder="%"
                  className="border rounded-xl px-4 py-3 w-full"
                />

                <div className="bg-slate-100 rounded-xl px-4 py-3 font-semibold w-full">
                  Rp{" "}
                  {Math.round(amount).toLocaleString(
                    "id-ID"
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recipient.is_mine}
                    onChange={(e) =>
                      updateRecipient(
                        recipient.id,
                        "is_mine",
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />

                  <span className="text-sm font-semibold">
                    Milik Saya
                  </span>
                </label>

                <input
                  value={recipient.notes}
                  onChange={(e) =>
                    updateRecipient(
                      recipient.id,
                      "notes",
                      e.target.value
                    )
                  }
                  placeholder="Catatan opsional"
                  className="border rounded-xl px-4 py-3 w-full"
                />

                <button
                  type="button"
                  onClick={() =>
                    removeRecipient(recipient.id)
                  }
                  className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t pt-5">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Total Persentase
              </p>

              <p
                className={`text-2xl font-black ${
                  totalPercentage > 0 && totalPercentage <= 100
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {totalPercentage}%
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Laba Ditahan
              </p>

              <p className="text-xl md:text-2xl font-black">
                Rp{" "}
                {Math.round(
                  remainingProfit
                ).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {totalPercentage > 100 && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 text-red-700 rounded-2xl p-4">
              <AlertTriangle size={18} />

              Total persentase tidak boleh lebih dari 100%.
            </div>
          )}

          {totalPercentage > 0 && totalPercentage < 100 && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 text-amber-700 rounded-2xl p-4">
              <AlertTriangle size={18} />

              Sisa laba akan menjadi laba ditahan dan tidak dibagikan pada periode ini.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
        <h2 className="text-xl font-bold">
          Riwayat Pembagian Laba
        </h2>

        <p className="text-sm text-slate-500 mt-1 mb-6">
          Riwayat pembagian berdasarkan unit bisnis
          dan periode.
        </p>

        <div className="space-y-6">
          {groupedHistory.map((group) => {
            const totalGroup =
              group.rows.reduce(
                (sum, item) =>
                  sum + Number(item.amount || 0),
                0
              );

            const myGroup =
              group.rows
                .filter((item) => item.is_mine)
                .reduce(
                  (sum, item) =>
                    sum +
                    Number(item.amount || 0),
                  0
                );

            return (
              <div
                key={`${group.businessTypeId}-${group.year}-${group.month}`}
                className="border rounded-2xl overflow-hidden"
              >
                <div className="bg-slate-100 px-4 md:px-5 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  <div>
                    <p className="font-bold">
                      {group.businessName}
                    </p>

                    <p className="text-sm text-slate-500">
                      Periode {group.month}/
                      {group.year}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeletePeriod(
                        group.businessTypeId,
                        group.month,
                        group.year
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100"
                  >
                    Hapus Periode
                  </button>
                </div>

                <div className="overflow-x-auto"><table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-t">
                      <th className="p-4 text-left">
                        Penerima
                      </th>

                      <th className="p-4 text-right">
                        Persentase
                      </th>

                      <th className="p-4 text-right">
                        Nominal
                      </th>

                      <th className="p-4 text-center">
                        Kepemilikan
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t"
                      >
                        <td className="p-4 font-semibold">
                          {row.recipient_name}
                        </td>

                        <td className="p-4 text-right">
                          {Number(
                            row.percentage || 0
                          ).toLocaleString("id-ID")}
                          %
                        </td>

                        <td className="p-4 text-right font-semibold">
                          Rp{" "}
                          {Number(
                            row.amount || 0
                          ).toLocaleString("id-ID")}
                        </td>

                        <td className="p-4 text-center">
                          {row.is_mine ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                              MILIK SAYA
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Rekan
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>

                <div className="border-t bg-slate-50 p-4 flex flex-col sm:flex-row sm:justify-end gap-4 sm:gap-8">
                  <div>
                    <span className="text-sm text-slate-500">
                      Total Dibagikan
                    </span>

                    <p className="font-bold">
                      Rp{" "}
                      {Math.round(
                        totalGroup
                      ).toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-slate-500">
                      Bagian Saya
                    </span>

                    <p className="font-bold">
                      Rp{" "}
                      {Math.round(
                        myGroup
                      ).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {groupedHistory.length === 0 && (
            <div className="p-6 md:p-10 text-center text-slate-500">
              Belum ada riwayat pembagian laba.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}