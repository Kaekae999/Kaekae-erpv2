"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Wallet,
  ShoppingCart,
  TrendingUp,
  Boxes,
  AlertTriangle,
  BarChart3,
  CircleDollarSign,
  HandCoins,
  UserRound,
  ReceiptText,
  FileText,
  ArrowRight,
  Factory,
} from "lucide-react";

export default function DashboardExecutive() {
  const { workspace } = useWorkspace();

  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchaseDetails, setPurchaseDetails] = useState<any[]>([]);
  const [salesDetails, setSalesDetails] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [operatingExpenses, setOperatingExpenses] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, [workspace]);

  function isWorkspaceMatch(item: any) {
    if (workspace === "all") return true;
    return item.products?.business_type_id === workspace;
  }

  async function loadDashboard() {
    const profileResult = await supabase
      .from("company_profiles")
      .select("company_name, address, city, logo_url")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const purchaseResult = await supabase
      .from("purchase_headers")
      .select(`
        id,
        transaction_number,
        transaction_date,
        total_amount,
        operational_cost,
        status,
        purchase_details(
          products(business_type_id)
        )
      `)
      .neq("status", "CANCELLED")
      .order("transaction_date", { ascending: false });

    const salesResult = await supabase
      .from("sales_headers")
      .select(`
        id,
        transaction_number,
        transaction_date,
        total_amount,
        status,
        sales_details(
          products(business_type_id)
        )
      `)
      .neq("status", "CANCELLED")
      .order("transaction_date", { ascending: false });

    const purchaseDetailResult = await supabase
      .from("purchase_details")
      .select(`
        qty,
        subtotal,
        total_cost,
        operational_cost,
        purchase_headers(status),
        products(
          name,
          purchase_price,
          business_type_id,
          categories(name)
        )
      `);

    const salesDetailResult = await supabase
      .from("sales_details")
      .select(`
        qty,
        subtotal,
        unit_cost,
        total_cost,
        gross_profit,
        sales_headers(status),
        products(
          name,
          purchase_price,
          business_type_id,
          categories(name)
        )
      `);

    const stockResult = await supabase
      .from("product_stocks")
      .select(`
        id,
        qty,
        average_cost,
        stock_value,
        products(
          name,
          purchase_price,
          minimum_stock,
          business_type_id,
          categories(name)
        ),
        warehouses(name)
      `);

    const distributionResult = await supabase
      .from("profit_distributions")
      .select(`
        id,
        business_type_id,
        recipient_name,
        percentage,
        amount,
        is_mine,
        period_month,
        period_year
      `);

    const operatingExpenseResult = await supabase
      .from("operating_expenses")
      .select(`
        id,
        business_type_id,
        expense_date,
        expense_name,
        amount,
        notes
      `)
      .order("expense_date", { ascending: false });

    if (purchaseResult.error) {
      console.error("Gagal load pembelian:", purchaseResult.error.message);
    }

    if (salesResult.error) {
      console.error("Gagal load penjualan:", salesResult.error.message);
    }

    if (purchaseDetailResult.error) {
      console.error("Gagal load detail pembelian:", purchaseDetailResult.error.message);
    }

    if (salesDetailResult.error) {
      console.error("Gagal load detail penjualan:", salesDetailResult.error.message);
    }

    if (stockResult.error) {
      console.error("Gagal load stok:", stockResult.error.message);
    }

    if (distributionResult.error) {
      console.error("Gagal load pembagian laba:", distributionResult.error.message);
    }

    if (operatingExpenseResult.error) {
      console.error("Gagal load beban usaha:", operatingExpenseResult.error.message);
    }

    const activePurchaseDetails = (purchaseDetailResult.data || []).filter(
      (item: any) => item.purchase_headers?.status !== "CANCELLED"
    );

    const activeSalesDetails = (salesDetailResult.data || []).filter(
      (item: any) => item.sales_headers?.status !== "CANCELLED"
    );

    const filteredPurchaseDetails =
      workspace === "all"
        ? activePurchaseDetails
        : activePurchaseDetails.filter(isWorkspaceMatch);

    const filteredSalesDetails =
      workspace === "all"
        ? activeSalesDetails
        : activeSalesDetails.filter(isWorkspaceMatch);

    const filteredStocks =
      workspace === "all"
        ? stockResult.data || []
        : (stockResult.data || []).filter(isWorkspaceMatch);

    const filteredPurchases =
      workspace === "all"
        ? purchaseResult.data || []
        : (purchaseResult.data || []).filter((item: any) =>
            item.purchase_details?.some(
              (detail: any) => detail.products?.business_type_id === workspace
            )
          );

    const filteredSales =
      workspace === "all"
        ? salesResult.data || []
        : (salesResult.data || []).filter((item: any) =>
            item.sales_details?.some(
              (detail: any) => detail.products?.business_type_id === workspace
            )
          );

    const filteredDistributions =
      workspace === "all"
        ? distributionResult.data || []
        : (distributionResult.data || []).filter(
            (item: any) => item.business_type_id === workspace
          );

    const filteredOperatingExpenses =
      workspace === "all"
        ? operatingExpenseResult.data || []
        : (operatingExpenseResult.data || []).filter(
            (item: any) => item.business_type_id === workspace
          );

    setProfile(profileResult.data);
    setPurchases(filteredPurchases);
    setSales(filteredSales);
    setPurchaseDetails(filteredPurchaseDetails);
    setSalesDetails(filteredSalesDetails);
    setStocks(filteredStocks);
    setDistributions(filteredDistributions);
    setOperatingExpenses(filteredOperatingExpenses);
  }

  const totalPembelian = purchaseDetails.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );

  const totalPenjualan = salesDetails.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );

  const totalHpp = salesDetails.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );

  const totalBiayaPembelian = purchases.reduce(
    (sum, item) => sum + Number(item.operational_cost || 0),
    0
  );

  const totalBebanUsaha = operatingExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const labaKotor = totalPenjualan - totalHpp;
  const labaBersih = labaKotor - totalBebanUsaha;

  const marginKotor =
    totalPenjualan === 0
      ? 0
      : Math.round((labaKotor / totalPenjualan) * 100);

  const marginBersih =
    totalPenjualan === 0
      ? 0
      : Math.round((labaBersih / totalPenjualan) * 100);

  const totalDibagikan = distributions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalPendapatanSaya = distributions
    .filter((item) => item.is_mine)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const nilaiPersediaan = stocks.reduce((sum, item) => {
    const qty = Number(item.qty || 0);
    const stockValue = qty <= 0 ? 0 : Number(item.stock_value || 0);
    return sum + stockValue;
  }, 0);

  const kategoriMap: any = {};

  purchaseDetails.forEach((item) => {
    const kategori = item.products?.categories?.name || "Tanpa Kategori";

    if (!kategoriMap[kategori]) {
      kategoriMap[kategori] = {
        kategori,
        pembelian: 0,
        penjualan: 0,
        hpp: 0,
        profit: 0,
        stok: 0,
        nilaiStok: 0,
      };
    }

    kategoriMap[kategori].pembelian += Number(item.subtotal || 0);
  });

  salesDetails.forEach((item) => {
    const kategori = item.products?.categories?.name || "Tanpa Kategori";
    const hpp = Number(item.total_cost || 0);

    if (!kategoriMap[kategori]) {
      kategoriMap[kategori] = {
        kategori,
        pembelian: 0,
        penjualan: 0,
        hpp: 0,
        profit: 0,
        stok: 0,
        nilaiStok: 0,
      };
    }

    kategoriMap[kategori].penjualan += Number(item.subtotal || 0);
    kategoriMap[kategori].hpp += hpp;
    kategoriMap[kategori].profit =
      kategoriMap[kategori].penjualan - kategoriMap[kategori].hpp;
  });

  stocks.forEach((item) => {
    const kategori = item.products?.categories?.name || "Tanpa Kategori";
    const qty = Number(item.qty || 0);
    const nilaiStok = qty <= 0 ? 0 : Number(item.stock_value || 0);

    if (!kategoriMap[kategori]) {
      kategoriMap[kategori] = {
        kategori,
        pembelian: 0,
        penjualan: 0,
        hpp: 0,
        profit: 0,
        stok: 0,
        nilaiStok: 0,
      };
    }

    kategoriMap[kategori].stok += qty;
    kategoriMap[kategori].nilaiStok += nilaiStok;
  });

  const kategoriUsaha = Object.values(kategoriMap);

  const stokMenipis = stocks.filter((item) => {
    const qty = Number(item.qty || 0);
    const minimum = Number(item.products?.minimum_stock || 0);
    return qty > 0 && qty <= minimum;
  });

  const recentTransactions = [
    ...purchases.map((item) => ({
      type: "Pembelian",
      date: item.transaction_date,
      number: item.transaction_number,
      amount: item.total_amount,
    })),
    ...sales.map((item) => ({
      type: "Penjualan",
      date: item.transaction_date,
      number: item.transaction_number,
      amount: item.total_amount,
    })),
    ...operatingExpenses.map((item) => ({
      type: "Beban Usaha",
      date: item.expense_date,
      number: item.expense_name,
      amount: item.amount,
    })),
  ]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 8);

  return (
    <Layout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Dashboard Executive
        </h1>

        <p className="text-sm md:text-base text-slate-500 mt-2 max-w-3xl">
          Ringkasan pembelian, penjualan, laba, beban usaha, pembagian hasil,
          dan stok berdasarkan workspace.
        </p>
      </div>

      <div className="bg-slate-950 text-white rounded-3xl p-3 md:p-5 mb-6 overflow-hidden">
        <div className="flex overflow-x-auto gap-3 pb-1 sm:grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 sm:overflow-visible">
          <HeroShortcut href="/transaksi/penjualan" label="Penjualan" icon={<ShoppingCart size={18} />} primary />
          <HeroShortcut href="/transaksi/pembelian" label="Pembelian" icon={<Wallet size={18} />} />
          <HeroShortcut href="/transaksi/produksi" label="Produksi" icon={<Factory size={18} />} />
          <HeroShortcut href="/keuangan/beban-usaha" label="Beban Usaha" icon={<ReceiptText size={18} />} />
          <HeroShortcut href="/keuangan/pembagian-laba" label="Bagi Laba" icon={<HandCoins size={18} />} />
          <HeroShortcut href="/dokumen/invoice" label="Invoice" icon={<FileText size={18} />} />
          <HeroShortcut href="/laporan" label="Laba Rugi" icon={<BarChart3 size={18} />} />
          <HeroShortcut href="/laporan/arus-kas" label="Arus Kas" icon={<Wallet size={18} />} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
        <StatCard
          title="Total Penjualan"
          value={`Rp ${totalPenjualan.toLocaleString("id-ID")}`}
          subtitle="Omzet berjalan"
          icon={<ShoppingCart size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Total Pembelian"
          value={`Rp ${totalPembelian.toLocaleString("id-ID")}`}
          subtitle={`Biaya pembelian tercatat Rp ${totalBiayaPembelian.toLocaleString(
            "id-ID"
          )}`}
          icon={<Wallet size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Laba Kotor"
          value={`Rp ${labaKotor.toLocaleString("id-ID")}`}
          subtitle={`HPP Rp ${totalHpp.toLocaleString(
            "id-ID"
          )} | Margin ${marginKotor}%`}
          icon={<TrendingUp size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Laba Bersih"
          value={`Rp ${labaBersih.toLocaleString("id-ID")}`}
          subtitle={`Beban usaha Rp ${totalBebanUsaha.toLocaleString(
            "id-ID"
          )} | Margin ${marginBersih}%`}
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
          title="Nilai Persediaan"
          value={`Rp ${nilaiPersediaan.toLocaleString("id-ID")}`}
          subtitle="Berdasarkan stock value"
          icon={<Boxes size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Total Dibagikan"
          value={`Rp ${totalDibagikan.toLocaleString("id-ID")}`}
          subtitle="Riwayat pembagian laba"
          icon={<HandCoins size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Pendapatan Saya"
          value={`Rp ${totalPendapatanSaya.toLocaleString("id-ID")}`}
          subtitle="Akumulasi bagian milik saya"
          icon={<UserRound size={28} className="text-slate-700" />}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-8">
        <div className="flex items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-bold text-lg">Ringkasan Kinerja</h2>
            <p className="text-sm text-slate-500 mt-1">
              Perbandingan omzet, laba kotor, laba bersih, dan beban usaha.
            </p>
          </div>
          <BarChart3 size={22} className="text-slate-500" />
        </div>

        <div className="space-y-5">
          <PerformanceBar
            label="Penjualan"
            value={totalPenjualan}
            max={Math.max(totalPenjualan, 1)}
          />
          <PerformanceBar
            label="Laba Kotor"
            value={Math.max(labaKotor, 0)}
            max={Math.max(totalPenjualan, 1)}
          />
          <PerformanceBar
            label="Laba Bersih"
            value={Math.max(labaBersih, 0)}
            max={Math.max(totalPenjualan, 1)}
          />
          <PerformanceBar
            label="Beban Usaha"
            value={totalBebanUsaha}
            max={Math.max(totalPenjualan, 1)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-8">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b flex items-center gap-2">
          <Boxes size={20} />
          <h2 className="font-bold text-lg">Per Kategori</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Kategori</th>
                <th className="p-4 text-right">Pembelian</th>
                <th className="p-4 text-right">Penjualan</th>
                <th className="p-4 text-right">HPP</th>
                <th className="p-4 text-right">Profit Kotor</th>
                <th className="p-4 text-right">Stok</th>
                <th className="p-4 text-right">Nilai Stok</th>
              </tr>
            </thead>

            <tbody>
              {kategoriUsaha.map((item: any) => (
                <tr key={item.kategori} className="border-t hover:bg-slate-50">
                  <td className="p-4 font-bold">{item.kategori}</td>
                  <td className="p-4 text-right">
                    Rp {item.pembelian.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right">
                    Rp {item.penjualan.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right">
                    Rp {item.hpp.toLocaleString("id-ID")}
                  </td>
                  <td
                    className={`p-4 text-right font-bold ${
                      item.profit >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    Rp {item.profit.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right">
                    {item.stok.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right font-semibold">
                    Rp {item.nilaiStok.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}

              {kategoriUsaha.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Belum ada data untuk workspace ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b flex items-center gap-2">
            <BarChart3 size={20} />
            <h2 className="font-bold text-lg">Transaksi Terbaru</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4 text-left">Tanggal</th>
                  <th className="p-4 text-left">Jenis</th>
                  <th className="p-4 text-left">No / Nama</th>
                  <th className="p-4 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {recentTransactions.map((item, index) => (
                  <tr key={index} className="border-t hover:bg-slate-50">
                    <td className="p-4">{item.date}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.type === "Penjualan"
                            ? "bg-green-100 text-green-700"
                            : item.type === "Pembelian"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4">{item.number}</td>
                    <td className="p-4 text-right font-semibold">
                      Rp {Number(item.amount || 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}

                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Belum ada transaksi untuk workspace ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b flex items-center gap-2">
            <AlertTriangle size={20} />
            <h2 className="font-bold text-lg">Stok Menipis</h2>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            {stokMenipis.map((item) => (
              <div
                key={item.id}
                className="border border-red-100 bg-red-50 rounded-2xl p-4"
              >
                <p className="font-bold text-red-700">
                  {item.products?.name || "-"}
                </p>

                <p className="text-sm text-red-600 mt-1">
                  Stok: {Number(item.qty || 0).toLocaleString("id-ID")} | Min:{" "}
                  {Number(item.products?.minimum_stock || 0).toLocaleString(
                    "id-ID"
                  )}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Gudang: {item.warehouses?.name || "-"}
                </p>
              </div>
            ))}

            {stokMenipis.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                Semua stok aman.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}


function HeroShortcut({
  href,
  label,
  icon,
  primary = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`min-w-[145px] sm:min-w-0 rounded-2xl px-4 py-3 font-bold flex items-center justify-between gap-3 transition ${
        primary
          ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
          : "bg-white/10 border border-white/10 text-white hover:bg-white/15"
      }`}
    >
      {label}
      {icon}
    </Link>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
    >
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
          {icon}
        </span>
        <span className="font-bold text-sm md:text-base">{label}</span>
      </div>
      <ArrowRight size={16} className="text-slate-400" />
    </Link>
  );
}

function PerformanceBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percentage = Math.max(
    0,
    Math.min(100, Math.round((value / max) * 100))
  );

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between gap-3 mb-2">
        <span className="font-semibold text-sm">{label}</span>
        <span className="font-bold text-sm text-right whitespace-nowrap">
          Rp {Math.round(value).toLocaleString("id-ID")}
        </span>
      </div>

      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

