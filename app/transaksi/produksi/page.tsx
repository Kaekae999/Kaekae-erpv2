"use client";

import Link from "next/link";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import {
  ArrowRight,
  Boxes,
  Factory,
  PackageCheck,
  Plus,
  ScrollText,
} from "lucide-react";

export default function ProduksiPage() {
  return (
    <Layout>
      <PageHeader
        title="Produksi"
        description="Kelola proses produksi dari bahan baku menjadi produk jadi."
        action={
          <Button>
            <Plus size={20} />
            Tambah Produksi
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <InfoCard
          icon={<Boxes size={24} />}
          title="Bahan Baku"
          description="Nanti mencatat bahan yang digunakan dalam proses produksi."
        />

        <InfoCard
          icon={<Factory size={24} />}
          title="Proses Produksi"
          description="Nanti mencatat tanggal, nomor produksi, dan biaya proses."
        />

        <InfoCard
          icon={<PackageCheck size={24} />}
          title="Produk Jadi"
          description="Nanti otomatis menambah stok produk hasil produksi."
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
              <Factory size={28} />
            </div>

            <h2 className="text-xl md:text-2xl font-black text-slate-900">
              Modul Produksi
            </h2>

            <p className="text-sm md:text-base text-slate-500 mt-2 max-w-2xl leading-7">
              Modul ini disiapkan untuk mencatat pemakaian bahan, biaya produksi,
              dan hasil produk jadi. Untuk sementara masih menjadi halaman
              persiapan agar struktur aplikasi tetap rapi dan siap dikembangkan.
            </p>
          </div>

          <div className="bg-slate-100 rounded-3xl p-4 md:p-5 w-full md:w-80">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">
              Status Modul
            </p>

            <p className="font-black text-slate-900 mt-2">
              Tahap Persiapan
            </p>

            <p className="text-sm text-slate-500 mt-2">
              Belum mempengaruhi stok dan laporan.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mt-6">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b flex items-center gap-2">
            <ScrollText size={20} />
            <h2 className="font-bold text-lg">
              Alur Produksi yang Akan Dibuat
            </h2>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            <Step number="1" title="Pilih bahan baku" />
            <Step number="2" title="Masukkan qty bahan yang dipakai" />
            <Step number="3" title="Tambahkan biaya produksi bila ada" />
            <Step number="4" title="Pilih produk jadi hasil produksi" />
            <Step number="5" title="Stok bahan berkurang dan stok produk jadi bertambah" />
          </div>
        </div>

        <div className="bg-slate-950 text-white rounded-3xl p-4 md:p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-300 font-bold">
            Shortcut Terkait
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            <Shortcut href="/inventory" label="Cek Inventory" />
            <Shortcut href="/master/produk" label="Master Produk" />
            <Shortcut href="/transaksi/pembelian" label="Pembelian Bahan" />
            <Shortcut href="/laporan" label="Laporan Laba Rugi" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
        {icon}
      </div>

      <h2 className="font-black text-slate-900 mt-4">
        {title}
      </h2>

      <p className="text-sm text-slate-500 mt-2 leading-6">
        {description}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shrink-0">
        {number}
      </div>

      <p className="font-semibold text-slate-700">
        {title}
      </p>
    </div>
  );
}

function Shortcut({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 font-bold flex items-center justify-between gap-3 hover:bg-white/15 transition"
    >
      {label}
      <ArrowRight size={18} />
    </Link>
  );
}
