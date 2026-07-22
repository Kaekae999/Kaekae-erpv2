"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { FileSpreadsheet, FileText, Search } from "lucide-react";

export default function LaporanPenjualanPage() {
  const { company, companies, workspace } = useWorkspace();
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [rows, setRows] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const companyName =
    companies.find((item) => item.id === company)?.name || "Perusahaan";

  useEffect(() => {
    loadData();
  }, [month, year, company, workspace]);

  function periodRange() {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    return { start, end };
  }

  async function loadData() {
    if (!company) {
      setRows([]);
      return;
    }

    setIsLoading(true);

    try {
      const { start, end } = periodRange();

      const { data, error } = await supabase
        .from("sales_headers")
        .select(`
          id,
          company_id,
          transaction_number,
          transaction_date,
          status,
          goods_amount,
          discount_amount,
          tax_amount,
          grand_total,
          total_amount,
          total_cost,
          gross_profit,
          customers(name),
          warehouses(name),
          sales_details(
            qty,
            price,
            subtotal,
            unit_name,
            products(code, name, business_type_id)
          )
        `)
        .eq("company_id", company)
        .gte("transaction_date", start)
        .lt("transaction_date", end)
        .order("transaction_date", { ascending: true });

      if (error) throw new Error(error.message);

      let result = data || [];

      if (workspace !== "all") {
        result = result.filter((sale: any) =>
          (sale.sales_details || []).some(
            (detail: any) =>
              detail.products?.business_type_id === workspace
          )
        );
      }

      setRows(result);
    } catch (error) {
      alert(
        "Gagal memuat laporan penjualan: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) =>
      [
        item.transaction_number,
        item.transaction_date,
        item.status,
        item.customers?.name,
        item.warehouses?.name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, keyword]);

  const activeRows = filteredRows.filter(
    (item) => item.status !== "CANCELLED"
  );

  const totalPenjualan = activeRows.reduce(
    (sum, item) =>
      sum + Number(item.grand_total ?? item.total_amount ?? 0),
    0
  );

  const totalHpp = activeRows.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );

  const labaKotor = activeRows.reduce(
    (sum, item) =>
      sum +
      Number(
        item.gross_profit ??
          Number(item.grand_total ?? item.total_amount ?? 0) -
            Number(item.total_cost || 0)
      ),
    0
  );

  function flatRows() {
    return filteredRows.flatMap((sale) => {
      const details = sale.sales_details || [];

      if (details.length === 0) {
        return [{
          Perusahaan: companyName,
          "No Transaksi": sale.transaction_number,
          Tanggal: sale.transaction_date,
          Customer: sale.customers?.name || "-",
          Gudang: sale.warehouses?.name || "-",
          Status: sale.status || "-",
          "Kode Produk": "-",
          Produk: "-",
          Qty: 0,
          Satuan: "-",
          Harga: 0,
          Subtotal: 0,
          Diskon: Number(sale.discount_amount || 0),
          Pajak: Number(sale.tax_amount || 0),
          "Grand Total": Number(sale.grand_total ?? sale.total_amount ?? 0),
          HPP: Number(sale.total_cost || 0),
          "Laba Kotor": Number(sale.gross_profit || 0),
        }];
      }

      return details.map((detail: any, index: number) => ({
        Perusahaan: companyName,
        "No Transaksi": sale.transaction_number,
        Tanggal: sale.transaction_date,
        Customer: sale.customers?.name || "-",
        Gudang: sale.warehouses?.name || "-",
        Status: sale.status || "-",
        "Kode Produk": detail.products?.code || "-",
        Produk: detail.products?.name || "-",
        Qty: Number(detail.qty || 0),
        Satuan: detail.unit_name || "-",
        Harga: Number(detail.price || 0),
        Subtotal: Number(detail.subtotal || 0),
        Diskon: index === 0 ? Number(sale.discount_amount || 0) : 0,
        Pajak: index === 0 ? Number(sale.tax_amount || 0) : 0,
        "Grand Total":
          index === 0
            ? Number(sale.grand_total ?? sale.total_amount ?? 0)
            : 0,
        HPP: index === 0 ? Number(sale.total_cost || 0) : 0,
        "Laba Kotor": index === 0 ? Number(sale.gross_profit || 0) : 0,
      }));
    });
  }

  function slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function exportExcel() {
    if (filteredRows.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }

    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(flatRows());
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Penjualan");
    XLSX.writeFile(
      workbook,
      `laporan-penjualan-${slugify(companyName)}-${year}-${String(month).padStart(2, "0")}.xlsx`
    );
  }

  async function exportPdf() {
    if (filteredRows.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const pdf = new jsPDF("l", "mm", "a4");

    pdf.setFontSize(16);
    pdf.text(`LAPORAN PENJUALAN ${companyName.toUpperCase()}`, 14, 15);

    pdf.setFontSize(10);
    pdf.text(
      `Periode: ${new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      })}`,
      14,
      22
    );

    autoTable(pdf, {
      startY: 28,
      head: [[
        "Tanggal",
        "No Transaksi",
        "Customer",
        "Status",
        "Grand Total",
        "HPP",
        "Laba Kotor",
      ]],
      body: filteredRows.map((item) => [
        item.transaction_date,
        item.transaction_number,
        item.customers?.name || "-",
        item.status || "-",
        `Rp ${Math.round(Number(item.grand_total ?? item.total_amount ?? 0)).toLocaleString("id-ID")}`,
        `Rp ${Math.round(Number(item.total_cost || 0)).toLocaleString("id-ID")}`,
        `Rp ${Math.round(Number(item.gross_profit || 0)).toLocaleString("id-ID")}`,
      ]),
      styles: { fontSize: 8 },
    });

    pdf.save(
      `laporan-penjualan-${slugify(companyName)}-${year}-${String(month).padStart(2, "0")}.pdf`
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Laporan Penjualan"
        description={`Riwayat penjualan ${companyName} sesuai workspace aktif.`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold"
            >
              <FileSpreadsheet size={18} />
              Excel
            </button>

            <button
              onClick={exportPdf}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-600 text-white font-bold"
            >
              <FileText size={18} />
              PDF
            </button>
          </div>
        }
      />

      <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-semibold">Bulan</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(year, m - 1, 1).toLocaleDateString("id-ID", {
                    month: "long",
                  })}
                </option>
              ))}
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

          <div className="sm:col-span-2">
            <label className="text-sm font-semibold">Cari</label>
            <div className="mt-2 flex items-center gap-2 border rounded-2xl px-4">
              <Search size={18} className="text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="No transaksi, customer, status..."
                className="w-full py-3 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <Summary title="Total Penjualan" value={totalPenjualan} />
        <Summary title="Total HPP" value={totalHpp} />
        <Summary title="Laba Kotor" value={labaKotor} />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b flex justify-between gap-4">
          <div>
            <h2 className="font-bold text-lg">Riwayat Penjualan</h2>
            <p className="text-sm text-slate-500 mt-1">{companyName}</p>
          </div>

          <span className="text-sm text-slate-500">
            {isLoading ? "Memuat..." : `${filteredRows.length} transaksi`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Tanggal</th>
                <th className="p-4 text-left">No Transaksi</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-right">HPP</th>
                <th className="p-4 text-right">Laba Kotor</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((item) => (
                <tr key={item.id} className="border-t hover:bg-slate-50">
                  <td className="p-4">{item.transaction_date}</td>
                  <td className="p-4 font-semibold">{item.transaction_number}</td>
                  <td className="p-4">{item.customers?.name || "-"}</td>
                  <td className="p-4">{item.status || "-"}</td>
                  <td className="p-4 text-right font-bold">
                    Rp {Math.round(Number(item.grand_total ?? item.total_amount ?? 0)).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right">
                    Rp {Math.round(Number(item.total_cost || 0)).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right font-bold">
                    Rp {Math.round(Number(item.gross_profit || 0)).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}

              {!isLoading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    Belum ada transaksi untuk perusahaan dan workspace ini.
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

function Summary({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-black mt-2">
        Rp {Math.round(value).toLocaleString("id-ID")}
      </p>
    </div>
  );
}