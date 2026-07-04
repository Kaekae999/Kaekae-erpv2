"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase";
import { Archive, Boxes, Wallet, Warehouse } from "lucide-react";

interface StockItem {
  id: string;
  qty: number;
  average_cost: number;
  stock_value: number;
  products: {
    code: string;
    name: string;
    minimum_stock: number;
  } | null;
  warehouses: {
    code: string;
    name: string;
  } | null;
}

export default function InventoryPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);

  useEffect(() => {
    loadStocks();
  }, []);

  async function loadStocks() {
    const { data, error } = await supabase
      .from("product_stocks")
      .select(`
        id,
        qty,
        average_cost,
        stock_value,
        products(code, name, minimum_stock),
        warehouses(code, name)
      `)
      .order("stock_value", { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }

    const normalizedStocks: StockItem[] = ((data || []) as any[]).map((item) => ({
      id: item.id,
      qty: Number(item.qty || 0),
      average_cost: Number(item.average_cost || 0),
      stock_value: Number(item.stock_value || 0),
      products: Array.isArray(item.products)
        ? item.products[0] || null
        : item.products || null,
      warehouses: Array.isArray(item.warehouses)
        ? item.warehouses[0] || null
        : item.warehouses || null,
    }));

    setStocks(normalizedStocks);
  }

  const totalStock = stocks.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );

  const jumlahItem = stocks.length;

  const nilaiPersediaan = stocks.reduce(
    (sum, item) => sum + Number(item.stock_value || 0),
    0
  );

  const stokMenipis = stocks.filter((item) => {
    const qty = Number(item.qty || 0);
    const minimum = Number(item.products?.minimum_stock || 0);
    return qty > 0 && qty <= minimum;
  }).length;

  return (
    <Layout>
      <PageHeader
        title="Inventory"
        description="Monitoring stok, average cost, dan nilai persediaan."
        action={
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 md:px-5 py-3 rounded-2xl font-semibold text-sm md:text-base">
            <Archive size={20} />
            Inventory Aktif
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard
          title="Total Stok"
          value={totalStock.toLocaleString("id-ID")}
          subtitle="Akumulasi qty"
          icon={<Boxes size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Jumlah Item"
          value={jumlahItem.toLocaleString("id-ID")}
          subtitle="Produk bergudang"
          icon={<Archive size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Nilai Persediaan"
          value={`Rp ${nilaiPersediaan.toLocaleString("id-ID")}`}
          subtitle="Berdasarkan stock value"
          icon={<Wallet size={28} className="text-slate-700" />}
        />

        <StatCard
          title="Stok Menipis"
          value={stokMenipis.toLocaleString("id-ID")}
          subtitle="Di bawah minimum"
          icon={<Warehouse size={28} className="text-slate-700" />}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b">
          <h2 className="font-bold text-lg">Stok Gudang</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Kode Produk</th>
                <th className="p-4 text-left">Produk</th>
                <th className="p-4 text-left">Gudang</th>
                <th className="p-4 text-right">Avg Cost</th>
                <th className="p-4 text-right">Qty</th>
                <th className="p-4 text-right">Nilai Persediaan</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {stocks.map((item) => {
                const qty = Number(item.qty || 0);
                const averageCost = Number(item.average_cost || 0);
                const stockValue = Number(item.stock_value || 0);
                const minimum = Number(item.products?.minimum_stock || 0);

                let status = "Aman";
                let statusClass = "bg-green-100 text-green-700";

                if (qty <= 0) {
                  status = "Habis";
                  statusClass = "bg-red-100 text-red-700";
                } else if (qty <= minimum) {
                  status = "Menipis";
                  statusClass = "bg-yellow-100 text-yellow-700";
                }

                return (
                  <tr key={item.id} className="border-t hover:bg-slate-50">
                    <td className="p-4">{item.products?.code || "-"}</td>
                    <td className="p-4 font-semibold">
                      {item.products?.name || "-"}
                    </td>
                    <td className="p-4">{item.warehouses?.name || "-"}</td>
                    <td className="p-4 text-right">
                      Rp {averageCost.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-right font-bold">
                      {qty.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-right font-semibold">
                      Rp {stockValue.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusClass}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {stocks.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Belum ada stok.
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
