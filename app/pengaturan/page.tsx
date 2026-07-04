"use client";

import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Building2,
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  Trash2,
} from "lucide-react";

const exportTables = [
  {
    table: "sales_headers",
    label: "Penjualan Header",
  },
  {
    table: "sales_details",
    label: "Penjualan Detail",
  },
  {
    table: "purchase_headers",
    label: "Pembelian Header",
  },
  {
    table: "purchase_details",
    label: "Pembelian Detail",
  },
  {
    table: "purchase_costs",
    label: "Biaya Pembelian",
  },
  {
    table: "product_stocks",
    label: "Inventory / Stok",
  },
  {
    table: "operating_expenses",
    label: "Beban Usaha",
  },
  {
    table: "profit_distributions",
    label: "Pembagian Laba",
  },
  {
    table: "cash_transactions",
    label: "Transaksi Kas",
  },
];

const resetSteps = [
  "purchase_costs",
  "sales_details",
  "sales_headers",
  "purchase_details",
  "purchase_headers",
  "product_stocks",
  "operating_expenses",
  "profit_distributions",
  "cash_transactions",
];

export default function PengaturanPage() {
  const router = useRouter();

  function safeFileName(text: string) {
    return text
      .toLowerCase()
      .replaceAll(" ", "-")
      .replace(/[^a-z0-9-_]/g, "");
  }

  function convertToCsv(rows: any[]) {
    if (!rows || rows.length === 0) {
      return "";
    }

    const headers = Array.from(
      rows.reduce((set: Set<string>, row: any) => {
        Object.keys(row || {}).forEach((key) => set.add(key));
        return set;
      }, new Set<string>())
    );

    const escapeCell = (value: any) => {
      if (value === null || value === undefined) return "";

      const text =
        typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

      return `"${text.replaceAll('"', '""')}"`;
    };

    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((header) => escapeCell(row[header])).join(",")
      ),
    ];

    return csvRows.join("\n");
  }

  function downloadTextFile(fileName: string, content: string, type = "text/plain") {
    const blob = new Blob([content], {
      type: `${type};charset=utf-8`,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }

  const downloadBackupInfo = () => {
    const content = [
      "KAEKAE - CATATAN BACKUP DATA",
      `Waktu: ${new Date().toLocaleString("id-ID")}`,
      "",
      "Backup database utama dilakukan melalui Supabase.",
      "Gunakan menu Export CSV untuk salinan data operasional.",
      "Jangan lakukan reset transaksi sebelum export selesai.",
      "",
      "Master data tidak ikut dihapus saat reset transaksi dummy:",
      "- Unit Bisnis",
      "- Produk",
      "- Kategori",
      "- Satuan",
      "- Gudang",
      "- Supplier",
      "- Customer",
      "- Rekening Bank",
      "- Profil Perusahaan",
    ].join("\n");

    downloadTextFile(
      `kaekae-backup-info-${new Date().toISOString().slice(0, 10)}.txt`,
      content
    );
  };

  async function exportTable(table: string, label: string) {
    const { data, error } = await supabase.from(table).select("*");

    if (error) {
      alert(`Gagal export ${label}: ${error.message}`);
      return;
    }

    const rows = data || [];

    if (rows.length === 0) {
      alert(`${label} masih kosong.`);
      return;
    }

    const csv = convertToCsv(rows);

    downloadTextFile(
      `${safeFileName(label)}-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      "text/csv"
    );
  }

  async function exportAllData() {
    const confirmed = window.confirm(
      "Download seluruh data operasional ke beberapa file CSV?"
    );

    if (!confirmed) return;

    for (const item of exportTables) {
      await exportTable(item.table, item.label);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  async function resetTransaksiDummy() {
    const firstConfirm = window.confirm(
      "Reset data transaksi dummy?\n\nYang dihapus:\n- Pembelian & detail\n- Penjualan & detail\n- Stok inventory\n- Beban usaha\n- Pembagian laba\n- Transaksi kas\n\nMaster produk, supplier, customer, gudang, rekening, dan profil TIDAK dihapus."
    );

    if (!firstConfirm) return;

    const typed = window.prompt(
      'Ketik RESET untuk melanjutkan.\n\nPastikan kamu sudah export data terlebih dahulu.'
    );

    if (typed !== "RESET") {
      alert("Reset dibatalkan.");
      return;
    }

    const finalConfirm = window.confirm(
      "Konfirmasi terakhir: semua data transaksi akan dikosongkan. Lanjutkan?"
    );

    if (!finalConfirm) return;

    try {
      for (const table of resetSteps) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (error) {
          throw new Error(`Gagal reset ${table}: ${error.message}`);
        }
      }

      alert("Reset data transaksi dummy berhasil. Master data tetap aman.");
    } catch (error) {
      alert(
        "Reset gagal: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Pengaturan"
        description="Pusat pengaturan profil, backup, ekspor, dan pemeliharaan data Kaekae."
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        <SettingCard
          icon={<Building2 size={24} />}
          title="Profil Perusahaan"
          description="Kelola identitas usaha, alamat, kontak, rekening invoice, logo, QR, dan footer dokumen."
          button="Buka Profil"
          onClick={() => router.push("/pengaturan/profil")}
        />

        <SettingCard
          icon={<DatabaseBackup size={24} />}
          title="Backup Data"
          description="Catat waktu backup dan panduan pengamanan data sebelum melakukan perubahan besar."
          button="Catat Backup"
          onClick={downloadBackupInfo}
        />

        <SettingCard
          icon={<FileSpreadsheet size={24} />}
          title="Export Semua CSV"
          description="Download data operasional ke file CSV: pembelian, penjualan, stok, beban usaha, kas, dan pembagian laba."
          button="Export Semua"
          onClick={exportAllData}
        />

        <SettingCard
          icon={<Download size={24} />}
          title="Dokumen & Laporan"
          description="Akses invoice PDF, laporan laba rugi, arus kas, dan dokumen operasional."
          button="Buka Laporan"
          onClick={() => router.push("/laporan")}
        />

        <SettingCard
          icon={<Settings size={24} />}
          title="Konfigurasi Sistem"
          description="Pengaturan aplikasi, workspace, penomoran dokumen, dan preferensi operasional."
          button="Tahap Berikutnya"
          disabled
        />

        <SettingCard
          icon={<ShieldAlert size={24} />}
          title="Reset Data Transaksi"
          description="Menghapus data transaksi dummy tanpa menghapus master produk, supplier, customer, gudang, rekening, dan unit bisnis."
          button="Reset Dummy"
          danger
          onClick={resetTransaksiDummy}
        />
      </div>

      <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <DatabaseBackup size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Export Data per Modul
            </h2>
            <p className="mt-2 text-slate-500 leading-7">
              Download data penting sebelum reset. File CSV bisa dibuka di
              Excel. Export PDF untuk laporan dan invoice tetap tersedia pada
              halaman masing-masing.
            </p>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 mt-6">
              {exportTables.map((item) => (
                <button
                  key={item.table}
                  type="button"
                  onClick={() => exportTable(item.table, item.label)}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-left"
                >
                  <span className="font-semibold text-slate-700">
                    {item.label}
                  </span>
                  <Download size={18} className="text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-red-50 border border-red-100 rounded-3xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-red-700">
              Area Reset Data Dummy
            </h2>
            <p className="mt-2 text-red-700 leading-7">
              Tombol reset hanya menghapus data transaksi dan stok. Master data
              tetap aman. Tetap lakukan export CSV terlebih dahulu sebelum reset.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SettingCard({
  icon,
  title,
  description,
  button,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  button: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col min-h-[280px]">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          danger
            ? "bg-red-50 text-red-600"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {icon}
      </div>

      <h2 className="mt-5 text-xl font-black text-slate-900">{title}</h2>
      <p className="mt-3 text-sm text-slate-500 leading-6 flex-1">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`mt-6 w-full rounded-2xl px-4 py-3 font-bold transition ${
          disabled
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : danger
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-slate-950 text-white hover:bg-slate-800"
        }`}
      >
        {button}
      </button>
    </div>
  );
}
