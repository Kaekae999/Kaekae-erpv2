"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase";
import {
  Banknote,
  ReceiptText,
  WalletCards,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

export default function LaporanArusKasPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [month, year]);

  function getPeriodRange() {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    return { startDate, endDate };
  }

  async function loadReport() {
    setIsLoading(true);

    const { startDate, endDate } = getPeriodRange();

    const salesResult = await supabase
      .from("sales_headers")
      .select("id, transaction_number, transaction_date, total_amount, grand_total, status")
      .neq("status", "CANCELLED")
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate);

    const purchaseResult = await supabase
      .from("purchase_headers")
      .select("id, transaction_number, transaction_date, grand_total, total_amount, status")
      .neq("status", "CANCELLED")
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate);

    const expenseResult = await supabase
      .from("operating_expenses")
      .select("id, expense_date, expense_name, amount, notes")
      .gte("expense_date", startDate)
      .lt("expense_date", endDate);

    const cashResult = await supabase
      .from("cash_transactions")
      .select("id, transaction_date, transaction_type, description, amount, notes")
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate);

    setIsLoading(false);

    if (salesResult.error) {
      alert("Gagal membaca penjualan: " + salesResult.error.message);
      return;
    }

    if (purchaseResult.error) {
      alert("Gagal membaca pembelian: " + purchaseResult.error.message);
      return;
    }

    if (expenseResult.error) {
      alert("Gagal membaca beban usaha: " + expenseResult.error.message);
      return;
    }

    if (cashResult.error) {
      alert("Gagal membaca transaksi kas: " + cashResult.error.message);
      return;
    }

    setSales(salesResult.data || []);
    setPurchases(purchaseResult.data || []);
    setExpenses(expenseResult.data || []);
    setCashTransactions(cashResult.data || []);
  }

  function isCashIn(type: string) {
    return ["MODAL_MASUK", "PEMASUKAN_LAIN", "TRANSFER_MASUK"].includes(type);
  }

  const kasMasukPenjualan = sales.reduce(
    (sum, item) =>
      sum + Number(item.grand_total ?? item.total_amount ?? 0),
    0
  );

  const kasKeluarPembelian = purchases.reduce(
    (sum, item) =>
      sum + Number(item.grand_total ?? item.total_amount ?? 0),
    0
  );

  const kasKeluarBeban = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const kasMasukManual = cashTransactions
    .filter((item) => isCashIn(item.transaction_type))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const kasKeluarManual = cashTransactions
    .filter((item) => !isCashIn(item.transaction_type))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalKasMasuk = kasMasukPenjualan + kasMasukManual;
  const totalKasKeluar =
    kasKeluarPembelian + kasKeluarBeban + kasKeluarManual;
  const arusKasBersih = totalKasMasuk - totalKasKeluar;

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
  });

  function detailRows() {
    const result: any[] = [];

    sales.forEach((item) => {
      result.push({
        Tanggal: item.transaction_date,
        Jenis: "Kas Masuk",
        Sumber: "Penjualan",
        Keterangan: item.transaction_number,
        Masuk: Number(item.grand_total ?? item.total_amount ?? 0),
        Keluar: 0,
      });
    });

    purchases.forEach((item) => {
      result.push({
        Tanggal: item.transaction_date,
        Jenis: "Kas Keluar",
        Sumber: "Pembelian",
        Keterangan: item.transaction_number,
        Masuk: 0,
        Keluar: Number(item.grand_total ?? item.total_amount ?? 0),
      });
    });

    expenses.forEach((item) => {
      result.push({
        Tanggal: item.expense_date,
        Jenis: "Kas Keluar",
        Sumber: "Beban Usaha",
        Keterangan: item.expense_name,
        Masuk: 0,
        Keluar: Number(item.amount || 0),
      });
    });

    cashTransactions.forEach((item) => {
      const masuk = isCashIn(item.transaction_type);

      result.push({
        Tanggal: item.transaction_date,
        Jenis: masuk ? "Kas Masuk" : "Kas Keluar",
        Sumber: "Transaksi Kas Manual",
        Keterangan: item.description,
        Masuk: masuk ? Number(item.amount || 0) : 0,
        Keluar: masuk ? 0 : Number(item.amount || 0),
      });
    });

    return result.sort((a, b) =>
      String(a.Tanggal).localeCompare(String(b.Tanggal))
    );
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");

    const ringkasan = [
      { Uraian: "Penjualan", Nominal: kasMasukPenjualan },
      { Uraian: "Kas Masuk Manual", Nominal: kasMasukManual },
      { Uraian: "Total Kas Masuk", Nominal: totalKasMasuk },
      { Uraian: "Pembelian", Nominal: kasKeluarPembelian },
      { Uraian: "Beban Usaha", Nominal: kasKeluarBeban },
      { Uraian: "Kas Keluar Manual", Nominal: kasKeluarManual },
      { Uraian: "Total Kas Keluar", Nominal: totalKasKeluar },
      { Uraian: "Arus Kas Bersih", Nominal: arusKasBersih },
    ];

    const wb = XLSX.utils.book_new();

    const wsRingkasan = XLSX.utils.json_to_sheet(ringkasan);
    const wsDetail = XLSX.utils.json_to_sheet(detailRows());

    wsRingkasan["!cols"] = [{ wch: 28 }, { wch: 20 }];
    wsDetail["!cols"] = [
      { wch: 12 },
      { wch: 14 },
      { wch: 24 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Mutasi Kas");

    XLSX.writeFile(
      wb,
      `laporan-arus-kas-${year}-${String(month).padStart(2, "0")}.xlsx`
    );
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const pdf = new jsPDF("p", "mm", "a4");

    pdf.setFontSize(16);
    pdf.text("LAPORAN ARUS KAS KAEKAE", 14, 15);

    pdf.setFontSize(10);
    pdf.text(`Periode: ${monthName} ${year}`, 14, 22);

    autoTable(pdf, {
      startY: 30,
      head: [["Uraian", "Nominal"]],
      body: [
        ["Penjualan", `Rp ${Math.round(kasMasukPenjualan).toLocaleString("id-ID")}`],
        ["Kas Masuk Manual", `Rp ${Math.round(kasMasukManual).toLocaleString("id-ID")}`],
        ["TOTAL KAS MASUK", `Rp ${Math.round(totalKasMasuk).toLocaleString("id-ID")}`],
        ["Pembelian", `Rp ${Math.round(kasKeluarPembelian).toLocaleString("id-ID")}`],
        ["Beban Usaha", `Rp ${Math.round(kasKeluarBeban).toLocaleString("id-ID")}`],
        ["Kas Keluar Manual", `Rp ${Math.round(kasKeluarManual).toLocaleString("id-ID")}`],
        ["TOTAL KAS KELUAR", `Rp ${Math.round(totalKasKeluar).toLocaleString("id-ID")}`],
        ["ARUS KAS BERSIH", `Rp ${Math.round(arusKasBersih).toLocaleString("id-ID")}`],
      ],
      styles: { fontSize: 9 },
      headStyles: { fontStyle: "bold" },
    });

    const finalY = (pdf as any).lastAutoTable?.finalY || 90;
    const details = detailRows();

    if (details.length > 0) {
      autoTable(pdf, {
        startY: finalY + 10,
        head: [["Tanggal", "Sumber", "Keterangan", "Masuk", "Keluar"]],
        body: details.map((item) => [
          item.Tanggal,
          item.Sumber,
          item.Keterangan,
          item.Masuk
            ? `Rp ${Math.round(item.Masuk).toLocaleString("id-ID")}`
            : "-",
          item.Keluar
            ? `Rp ${Math.round(item.Keluar).toLocaleString("id-ID")}`
            : "-",
        ]),
        styles: { fontSize: 7 },
        headStyles: { fontStyle: "bold" },
      });
    }

    pdf.save(
      `laporan-arus-kas-${year}-${String(month).padStart(2, "0")}.pdf`
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Laporan Arus Kas"
        description="Ringkasan kas masuk, kas keluar, arus kas bersih, serta export Excel dan PDF."
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

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-6 md:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          <div className="bg-slate-100 rounded-2xl px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">
              Periode
            </p>
            <p className="font-black mt-1">
              {monthName} {year}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isLoading ? "Memuat data..." : "Data siap"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard
          title="Total Kas Masuk"
          value={`Rp ${totalKasMasuk.toLocaleString("id-ID")}`}
          subtitle="Penjualan + kas masuk manual"
          icon={<WalletCards size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Total Kas Keluar"
          value={`Rp ${totalKasKeluar.toLocaleString("id-ID")}`}
          subtitle="Pembelian + beban + kas keluar manual"
          icon={<ReceiptText size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Arus Kas Bersih"
          value={`Rp ${arusKasBersih.toLocaleString("id-ID")}`}
          subtitle="Kas masuk - kas keluar"
          icon={<Banknote size={28} className="text-slate-700" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b">
            <h2 className="font-bold text-lg">Kas Masuk</h2>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            <Row label="Penjualan" value={kasMasukPenjualan} />
            <Row label="Kas Masuk Manual" value={kasMasukManual} />

            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 bg-emerald-50 text-emerald-700 rounded-2xl px-4 md:px-5 py-4 text-base md:text-xl">
              <span className="font-bold">Total Kas Masuk</span>
              <span className="font-black">
                Rp {totalKasMasuk.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b">
            <h2 className="font-bold text-lg">Kas Keluar</h2>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            <Row label="Pembelian" value={kasKeluarPembelian} />
            <Row label="Beban Usaha" value={kasKeluarBeban} />
            <Row label="Kas Keluar Manual" value={kasKeluarManual} />

            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 bg-red-50 text-red-700 rounded-2xl px-4 md:px-5 py-4 text-base md:text-xl">
              <span className="font-bold">Total Kas Keluar</span>
              <span className="font-black">
                Rp {totalKasKeluar.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b">
          <h2 className="font-bold text-lg">Mutasi Arus Kas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Tanggal</th>
                <th className="p-4 text-left">Sumber</th>
                <th className="p-4 text-left">Keterangan</th>
                <th className="p-4 text-right">Kas Masuk</th>
                <th className="p-4 text-right">Kas Keluar</th>
              </tr>
            </thead>

            <tbody>
              {detailRows().map((item, index) => (
                <tr key={`${item.Tanggal}-${index}`} className="border-t">
                  <td className="p-4">{item.Tanggal}</td>
                  <td className="p-4 font-semibold">{item.Sumber}</td>
                  <td className="p-4">{item.Keterangan}</td>
                  <td className="p-4 text-right text-emerald-700 font-bold">
                    {item.Masuk
                      ? `Rp ${item.Masuk.toLocaleString("id-ID")}`
                      : "-"}
                  </td>
                  <td className="p-4 text-right text-red-700 font-bold">
                    {item.Keluar
                      ? `Rp ${item.Keluar.toLocaleString("id-ID")}`
                      : "-"}
                  </td>
                </tr>
              ))}

              {!isLoading && detailRows().length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    Belum ada arus kas pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b pb-3">
      <span>{label}</span>
      <span className="font-bold">
        Rp {value.toLocaleString("id-ID")}
      </span>
    </div>
  );
}
