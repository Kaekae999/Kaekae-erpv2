"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  CircleDollarSign,
  HandCoins,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";

interface BusinessType {
  id: string;
  name: string;
}

export default function LaporanPage() {
  const today = new Date();
  const { workspace } = useWorkspace();

  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [selectedBusinessType, setSelectedBusinessType] = useState(
    workspace === "all" ? "all" : workspace
  );

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [salesDetails, setSalesDetails] = useState<any[]>([]);
  const [operatingExpenses, setOperatingExpenses] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBusinessTypes();
  }, []);

  useEffect(() => {
    setSelectedBusinessType(workspace === "all" ? "all" : workspace);
  }, [workspace]);

  useEffect(() => {
    loadReport();
  }, [selectedBusinessType, month, year]);

  async function loadBusinessTypes() {
    const { data, error } = await supabase
      .from("business_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Gagal mengambil unit bisnis:", error.message);
      return;
    }

    setBusinessTypes(data || []);
  }

  function getPeriodRange() {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    return { startDate, endDate };
  }

  async function loadReport() {
    setIsLoading(true);

    try {
      const { startDate, endDate } = getPeriodRange();

      let salesQuery = supabase
        .from("sales_details")
        .select(`
          qty,
          subtotal,
          total_cost,
          gross_profit,
          sales_headers!inner(
            transaction_number,
            transaction_date,
            status
          ),
          products!inner(
            id,
            name,
            business_type_id,
            categories(name)
          )
        `)
        .gte("sales_headers.transaction_date", startDate)
        .lt("sales_headers.transaction_date", endDate)
        .neq("sales_headers.status", "CANCELLED");

      if (selectedBusinessType !== "all") {
        salesQuery = salesQuery.eq(
          "products.business_type_id",
          selectedBusinessType
        );
      }

      let expenseQuery = supabase
        .from("operating_expenses")
        .select(`
          id,
          business_type_id,
          expense_date,
          expense_name,
          amount,
          notes,
          business_types(name)
        `)
        .gte("expense_date", startDate)
        .lt("expense_date", endDate)
        .order("expense_date", { ascending: false });

      if (selectedBusinessType !== "all") {
        expenseQuery = expenseQuery.eq("business_type_id", selectedBusinessType);
      }

      let distributionQuery = supabase
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
        .eq("period_month", month)
        .eq("period_year", year);

      if (selectedBusinessType !== "all") {
        distributionQuery = distributionQuery.eq(
          "business_type_id",
          selectedBusinessType
        );
      }

      const [salesResult, expenseResult, distributionResult] =
        await Promise.all([salesQuery, expenseQuery, distributionQuery]);

      if (salesResult.error) throw new Error(salesResult.error.message);
      if (expenseResult.error) throw new Error(expenseResult.error.message);
      if (distributionResult.error)
        throw new Error(distributionResult.error.message);

      setSalesDetails(salesResult.data || []);
      setOperatingExpenses(expenseResult.data || []);
      setDistributions(distributionResult.data || []);
    } catch (error) {
      alert(
        "Gagal memuat laporan: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsLoading(false);
    }
  }

  const totalPenjualan = salesDetails.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );

  const totalHpp = salesDetails.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );

  const labaKotor = totalPenjualan - totalHpp;

  const totalBebanUsaha = operatingExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const labaBersih = labaKotor - totalBebanUsaha;

  const totalDibagikan = distributions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const pendapatanSaya = distributions
    .filter((item) => item.is_mine)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const labaDitahan = labaBersih - totalDibagikan;

  const marginKotor =
    totalPenjualan === 0 ? 0 : Math.round((labaKotor / totalPenjualan) * 100);

  const marginBersih =
    totalPenjualan === 0 ? 0 : Math.round((labaBersih / totalPenjualan) * 100);

  const salesByCategory = useMemo(() => {
    const map = new Map<
      string,
      {
        category: string;
        sales: number;
        hpp: number;
        profit: number;
      }
    >();

    salesDetails.forEach((item) => {
      const category = item.products?.categories?.name || "Tanpa Kategori";
      const existing =
        map.get(category) ||
        {
          category,
          sales: 0,
          hpp: 0,
          profit: 0,
        };

      existing.sales += Number(item.subtotal || 0);
      existing.hpp += Number(item.total_cost || 0);
      existing.profit = existing.sales - existing.hpp;

      map.set(category, existing);
    });

    return Array.from(map.values());
  }, [salesDetails]);

  const selectedBusinessName =
    selectedBusinessType === "all"
      ? "Semua Unit Bisnis"
      : businessTypes.find((item) => item.id === selectedBusinessType)?.name ||
        "-";

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
  });

  async function exportExcel() {
    const XLSX = await import("xlsx");

    const ringkasan = [
      {
        Uraian: "Penjualan Bersih",
        Nominal: totalPenjualan,
      },
      {
        Uraian: "HPP",
        Nominal: totalHpp,
      },
      {
        Uraian: "Laba Kotor",
        Nominal: labaKotor,
      },
      {
        Uraian: "Beban Usaha",
        Nominal: totalBebanUsaha,
      },
      {
        Uraian: "Laba Bersih",
        Nominal: labaBersih,
      },
      {
        Uraian: "Total Dibagikan",
        Nominal: totalDibagikan,
      },
      {
        Uraian: "Pendapatan Saya",
        Nominal: pendapatanSaya,
      },
      {
        Uraian: "Laba Ditahan",
        Nominal: labaDitahan,
      },
    ];

    const kategori = salesByCategory.map((item) => ({
      Kategori: item.category,
      Penjualan: item.sales,
      HPP: item.hpp,
      "Laba Kotor": item.profit,
    }));

    const beban = operatingExpenses.map((item) => ({
      Tanggal: item.expense_date,
      Beban: item.expense_name,
      Nominal: Number(item.amount || 0),
      Catatan: item.notes || "",
    }));

    const pembagian = distributions.map((item) => ({
      Penerima: item.recipient_name,
      Persentase: Number(item.percentage || 0),
      Nominal: Number(item.amount || 0),
      "Milik Saya": item.is_mine ? "Ya" : "Tidak",
      Catatan: item.notes || "",
    }));

    const wb = XLSX.utils.book_new();

    const wsRingkasan = XLSX.utils.json_to_sheet(ringkasan);
    const wsKategori = XLSX.utils.json_to_sheet(kategori);
    const wsBeban = XLSX.utils.json_to_sheet(beban);
    const wsPembagian = XLSX.utils.json_to_sheet(pembagian);

    wsRingkasan["!cols"] = [{ wch: 28 }, { wch: 18 }];
    wsKategori["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    wsBeban["!cols"] = [{ wch: 12 }, { wch: 28 }, { wch: 18 }, { wch: 30 }];
    wsPembagian["!cols"] = [
      { wch: 24 },
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan");
    XLSX.utils.book_append_sheet(wb, wsKategori, "Per Kategori");
    XLSX.utils.book_append_sheet(wb, wsBeban, "Beban Usaha");
    XLSX.utils.book_append_sheet(wb, wsPembagian, "Pembagian Laba");

    XLSX.writeFile(
      wb,
      `laporan-laba-rugi-${year}-${String(month).padStart(2, "0")}.xlsx`
    );
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const pdf = new jsPDF("p", "mm", "a4");

    pdf.setFontSize(16);
    pdf.text("LAPORAN LABA RUGI KAEKAE", 14, 15);

    pdf.setFontSize(10);
    pdf.text(`Periode: ${monthName} ${year}`, 14, 22);
    pdf.text(`Unit Bisnis: ${selectedBusinessName}`, 14, 28);

    autoTable(pdf, {
      startY: 36,
      head: [["Uraian", "Nominal"]],
      body: [
        ["Penjualan Bersih", `Rp ${Math.round(totalPenjualan).toLocaleString("id-ID")}`],
        ["HPP", `Rp ${Math.round(totalHpp).toLocaleString("id-ID")}`],
        ["Laba Kotor", `Rp ${Math.round(labaKotor).toLocaleString("id-ID")}`],
        ["Beban Usaha", `Rp ${Math.round(totalBebanUsaha).toLocaleString("id-ID")}`],
        ["Laba Bersih", `Rp ${Math.round(labaBersih).toLocaleString("id-ID")}`],
        ["Total Dibagikan", `Rp ${Math.round(totalDibagikan).toLocaleString("id-ID")}`],
        ["Pendapatan Saya", `Rp ${Math.round(pendapatanSaya).toLocaleString("id-ID")}`],
        ["Laba Ditahan", `Rp ${Math.round(labaDitahan).toLocaleString("id-ID")}`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fontStyle: "bold" },
    });

    const finalY = (pdf as any).lastAutoTable?.finalY || 90;

    if (salesByCategory.length > 0) {
      autoTable(pdf, {
        startY: finalY + 10,
        head: [["Kategori", "Penjualan", "HPP", "Laba Kotor"]],
        body: salesByCategory.map((item) => [
          item.category,
          `Rp ${Math.round(item.sales).toLocaleString("id-ID")}`,
          `Rp ${Math.round(item.hpp).toLocaleString("id-ID")}`,
          `Rp ${Math.round(item.profit).toLocaleString("id-ID")}`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fontStyle: "bold" },
      });
    }

    pdf.save(
      `laporan-laba-rugi-${year}-${String(month).padStart(2, "0")}.pdf`
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Laporan Laba Rugi"
        description="Ringkasan penjualan, HPP, beban usaha, laba bersih, dan pembagian laba per periode."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-3 md:px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm md:text-base"
            >
              <FileSpreadsheet size={18} />
              Excel
            </button>

            <button
              onClick={exportPdf}
              className="flex items-center gap-2 px-3 md:px-4 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm md:text-base"
            >
              <FileText size={18} />
              PDF
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="text-sm font-semibold">Unit Bisnis</label>
            <select
              value={selectedBusinessType}
              onChange={(e) => setSelectedBusinessType(e.target.value)}
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            >
              <option value="all">Semua Unit Bisnis</option>
              {businessTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Bulan</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map(
                (item) => (
                  <option key={item} value={item}>
                    {new Date(year, item - 1, 1).toLocaleDateString("id-ID", {
                      month: "long",
                    })}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Tahun</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            />
          </div>

          <div className="bg-slate-100 rounded-2xl px-4 md:px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">
              Periode
            </p>
            <p className="font-black mt-1">
              {monthName} {year}
            </p>
            <p className="text-sm text-slate-500">{selectedBusinessName}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard
          title="Penjualan Bersih"
          value={`Rp ${totalPenjualan.toLocaleString("id-ID")}`}
          subtitle="Omzet periode"
          icon={<ShoppingCart size={28} className="text-slate-700" />}
        />

        <StatCard
          title="HPP"
          value={`Rp ${totalHpp.toLocaleString("id-ID")}`}
          subtitle="Harga pokok penjualan"
          icon={<Wallet size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Laba Kotor"
          value={`Rp ${labaKotor.toLocaleString("id-ID")}`}
          subtitle={`Margin kotor ${marginKotor}%`}
          icon={<TrendingUp size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Laba Bersih"
          value={`Rp ${labaBersih.toLocaleString("id-ID")}`}
          subtitle={`Margin bersih ${marginBersih}%`}
          icon={<CircleDollarSign size={28} className="text-slate-700" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard
          title="Beban Usaha"
          value={`Rp ${totalBebanUsaha.toLocaleString("id-ID")}`}
          subtitle="Biaya di luar HPP"
          icon={<ReceiptText size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Total Dibagikan"
          value={`Rp ${Math.round(totalDibagikan).toLocaleString("id-ID")}`}
          subtitle="Pembagian laba periode"
          icon={<HandCoins size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Pendapatan Saya"
          value={`Rp ${Math.round(pendapatanSaya).toLocaleString("id-ID")}`}
          subtitle="Bagian milik saya"
          icon={<UserRound size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Laba Ditahan"
          value={`Rp ${Math.round(labaDitahan).toLocaleString("id-ID")}`}
          subtitle="Laba belum dibagikan"
          icon={<CalendarDays size={28} className="text-slate-700" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b">
            <h2 className="font-bold text-lg">Laba Rugi Ringkas</h2>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            <div className="flex justify-between gap-4 border-b pb-3">
              <span>Penjualan Bersih</span>
              <span className="font-bold">
                Rp {totalPenjualan.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b pb-3">
              <span>HPP</span>
              <span className="font-bold">
                Rp {totalHpp.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b pb-3 text-base md:text-lg">
              <span className="font-bold">Laba Kotor</span>
              <span className="font-black text-emerald-700">
                Rp {labaKotor.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b pb-3">
              <span>Beban Usaha</span>
              <span className="font-bold">
                Rp {totalBebanUsaha.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 bg-slate-950 text-white rounded-2xl px-4 md:px-5 py-4 text-lg md:text-xl">
              <span className="font-bold">Laba Bersih</span>
              <span className="font-black">
                Rp {labaBersih.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b">
            <h2 className="font-bold text-lg">Pembagian Laba</h2>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            <div className="flex justify-between gap-4 border-b pb-3">
              <span>Laba Bersih</span>
              <span className="font-bold">
                Rp {labaBersih.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b pb-3">
              <span>Total Dibagikan</span>
              <span className="font-bold">
                Rp {Math.round(totalDibagikan).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b pb-3">
              <span>Pendapatan Saya</span>
              <span className="font-bold text-emerald-700">
                Rp {Math.round(pendapatanSaya).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 bg-slate-100 rounded-2xl px-4 md:px-5 py-4 text-base md:text-lg">
              <span className="font-bold">Laba Ditahan</span>
              <span className="font-black">
                Rp {Math.round(labaDitahan).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-8">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b">
          <h2 className="font-bold text-lg">Penjualan per Kategori</h2>
        </div>

        <div className="overflow-x-auto"><table className="w-full min-w-[760px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-left">Kategori</th>
              <th className="p-4 text-right">Penjualan</th>
              <th className="p-4 text-right">HPP</th>
              <th className="p-4 text-right">Laba Kotor</th>
            </tr>
          </thead>

          <tbody>
            {salesByCategory.map((item) => (
              <tr key={item.category} className="border-t hover:bg-slate-50">
                <td className="p-4 font-bold">{item.category}</td>
                <td className="p-4 text-right">
                  Rp {item.sales.toLocaleString("id-ID")}
                </td>
                <td className="p-4 text-right">
                  Rp {item.hpp.toLocaleString("id-ID")}
                </td>
                <td
                  className={`p-4 text-right font-bold ${
                    item.profit >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  Rp {item.profit.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}

            {salesByCategory.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Belum ada penjualan pada periode ini.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b">
            <h2 className="font-bold text-lg">Detail Beban Usaha</h2>
          </div>

          <div className="overflow-x-auto"><table className="w-full min-w-[760px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Tanggal</th>
                <th className="p-4 text-left">Beban</th>
                <th className="p-4 text-right">Nominal</th>
              </tr>
            </thead>

            <tbody>
              {operatingExpenses.map((item) => (
                <tr key={item.id} className="border-t hover:bg-slate-50">
                  <td className="p-4">{item.expense_date}</td>
                  <td className="p-4 font-semibold">{item.expense_name}</td>
                  <td className="p-4 text-right font-bold">
                    Rp {Number(item.amount || 0).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}

              {operatingExpenses.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    Belum ada beban usaha pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b">
            <h2 className="font-bold text-lg">Detail Pembagian Laba</h2>
          </div>

          <div className="overflow-x-auto"><table className="w-full min-w-[760px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Penerima</th>
                <th className="p-4 text-right">Persentase</th>
                <th className="p-4 text-right">Nominal</th>
              </tr>
            </thead>

            <tbody>
              {distributions.map((item) => (
                <tr key={item.id} className="border-t hover:bg-slate-50">
                  <td className="p-4 font-semibold">
                    {item.recipient_name}
                    {item.is_mine && (
                      <span className="ml-2 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                        Saya
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {Number(item.percentage || 0).toLocaleString("id-ID")}%
                  </td>
                  <td className="p-4 text-right font-bold">
                    Rp {Math.round(Number(item.amount || 0)).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}

              {distributions.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    Belum ada pembagian laba pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>
      </div>
    </Layout>
  );
}
