"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Search,
} from "lucide-react";

export default function LaporanPembelianPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [month, year]);

  function periodRange() {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    return { start, end };
  }

  async function loadData() {
    setIsLoading(true);

    const { start, end } = periodRange();

    const { data, error } = await supabase
      .from("purchase_headers")
      .select(`
        id,
        transaction_number,
        transaction_date,
        supplier_id,
        warehouse_id,
        goods_amount,
        operational_cost,
        grand_total,
        total_amount,
        status,
        suppliers(name),
        warehouses(name),
        purchase_details(
          qty,
          price,
          subtotal,
          operational_cost,
          total_cost,
          unit_cost,
          products(code, name)
        )
      `)
      .gte("transaction_date", start)
      .lt("transaction_date", end)
      .order("transaction_date", { ascending: true });

    setIsLoading(false);

    if (error) {
      alert("Gagal memuat laporan pembelian: " + error.message);
      return;
    }

    setRows(data || []);
  }

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((item) => {
      const text = [
        item.transaction_number,
        item.transaction_date,
        item.status,
        item.suppliers?.name,
        item.warehouses?.name,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [rows, keyword]);

  const activeRows = filteredRows.filter(
    (item) => item.status !== "CANCELLED"
  );

  const totalBarang = activeRows.reduce(
    (sum, item) => sum + Number(item.goods_amount || 0),
    0
  );

  const totalBiayaPembelian = activeRows.reduce(
    (sum, item) => sum + Number(item.operational_cost || 0),
    0
  );

  const totalModal = activeRows.reduce(
    (sum, item) =>
      sum + Number(item.grand_total ?? item.total_amount ?? 0),
    0
  );

  function flatRows() {
    return filteredRows.flatMap((purchase) => {
      const details = purchase.purchase_details || [];

      if (details.length === 0) {
        return [
          {
            "No Transaksi": purchase.transaction_number,
            Tanggal: purchase.transaction_date,
            Supplier: purchase.suppliers?.name || "-",
            Gudang: purchase.warehouses?.name || "-",
            Status: purchase.status || "-",
            "Kode Produk": "-",
            Produk: "-",
            Qty: 0,
            Harga: 0,
            Subtotal: 0,
            "Biaya Pembelian": Number(purchase.operational_cost || 0),
            "Total Modal": Number(
              purchase.grand_total ?? purchase.total_amount ?? 0
            ),
          },
        ];
      }

      return details.map((detail: any, index: number) => ({
        "No Transaksi": purchase.transaction_number,
        Tanggal: purchase.transaction_date,
        Supplier: purchase.suppliers?.name || "-",
        Gudang: purchase.warehouses?.name || "-",
        Status: purchase.status || "-",
        "Kode Produk": detail.products?.code || "-",
        Produk: detail.products?.name || "-",
        Qty: Number(detail.qty || 0),
        Harga: Number(detail.price || 0),
        Subtotal: Number(detail.subtotal || 0),
        "Biaya Pembelian":
          index === 0 ? Number(purchase.operational_cost || 0) : 0,
        "Total Modal":
          index === 0
            ? Number(purchase.grand_total ?? purchase.total_amount ?? 0)
            : 0,
      }));
    });
  }

  async function exportExcel() {
    if (filteredRows.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }

    const XLSX = await import("xlsx");

    const data = flatRows();
    const worksheet = XLSX.utils.json_to_sheet(data);

    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 24 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 28 },
      { wch: 10 },
      { wch: 15 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pembelian");

    XLSX.writeFile(
      workbook,
      `laporan-pembelian-${year}-${String(month).padStart(2, "0")}.xlsx`
    );
  }

  async function exportPdf() {
    if (filteredRows.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }

    const { jsPDF } = await import("jspdf");
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const pdf = new jsPDF("l", "mm", "a4");

    pdf.setFontSize(16);
    pdf.text("LAPORAN PEMBELIAN KAEKAE", 14, 15);

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
      head: [
        [
          "Tanggal",
          "No Transaksi",
          "Supplier",
          "Status",
          "Barang",
          "Biaya Pembelian",
          "Total Modal",
        ],
      ],
      body: filteredRows.map((item) => [
        item.transaction_date,
        item.transaction_number,
        item.suppliers?.name || "-",
        item.status || "-",
        `Rp ${Math.round(Number(item.goods_amount || 0)).toLocaleString(
          "id-ID"
        )}`,
        `Rp ${Math.round(Number(item.operational_cost || 0)).toLocaleString(
          "id-ID"
        )}`,
        `Rp ${Math.round(
          Number(item.grand_total ?? item.total_amount ?? 0)
        ).toLocaleString("id-ID")}`,
      ]),
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fontStyle: "bold",
      },
    });

    const finalY = (pdf as any).lastAutoTable?.finalY || 40;

    pdf.setFontSize(10);
    pdf.text(
      `Total Barang: Rp ${Math.round(totalBarang).toLocaleString("id-ID")}`,
      14,
      finalY + 10
    );

    pdf.text(
      `Total Biaya Pembelian: Rp ${Math.round(
        totalBiayaPembelian
      ).toLocaleString("id-ID")}`,
      14,
      finalY + 16
    );

    pdf.text(
      `Total Modal: Rp ${Math.round(totalModal).toLocaleString("id-ID")}`,
      14,
      finalY + 22
    );

    pdf.save(
      `laporan-pembelian-${year}-${String(month).padStart(2, "0")}.pdf`
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Laporan Pembelian"
        description="Riwayat pembelian lengkap dengan biaya pembelian, total modal, dan export Excel/PDF."
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

      <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="text-sm font-semibold">Cari</label>

            <div className="mt-2 flex items-center gap-2 border rounded-2xl px-4">
              <Search size={18} className="text-slate-400" />

              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="No transaksi, supplier, status..."
                className="w-full py-3 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
        <Summary title="Total Barang" value={totalBarang} />
        <Summary title="Biaya Pembelian" value={totalBiayaPembelian} />
        <Summary title="Total Modal" value={totalModal} />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b flex flex-col sm:flex-row sm:justify-between gap-2">
          <h2 className="font-bold text-lg">Riwayat Pembelian</h2>

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
                <th className="p-4 text-left">Supplier</th>
                <th className="p-4 text-left">Gudang</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-right">Barang</th>
                <th className="p-4 text-right">Biaya Pembelian</th>
                <th className="p-4 text-right">Total Modal</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((item) => (
                <tr key={item.id} className="border-t hover:bg-slate-50">
                  <td className="p-4">{item.transaction_date}</td>

                  <td className="p-4 font-semibold">
                    {item.transaction_number}
                  </td>

                  <td className="p-4">{item.suppliers?.name || "-"}</td>

                  <td className="p-4">{item.warehouses?.name || "-"}</td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.status || "-"}
                    </span>
                  </td>

                  <td className="p-4 text-right font-semibold">
                    Rp{" "}
                    {Math.round(Number(item.goods_amount || 0)).toLocaleString(
                      "id-ID"
                    )}
                  </td>

                  <td className="p-4 text-right">
                    Rp{" "}
                    {Math.round(
                      Number(item.operational_cost || 0)
                    ).toLocaleString("id-ID")}
                  </td>

                  <td className="p-4 text-right font-bold">
                    Rp{" "}
                    {Math.round(
                      Number(item.grand_total ?? item.total_amount ?? 0)
                    ).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}

              {!isLoading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500">
                    Belum ada transaksi pada periode ini.
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
    <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-xl md:text-2xl font-black mt-2">
        Rp {Math.round(value).toLocaleString("id-ID")}
      </p>
    </div>
  );
}
