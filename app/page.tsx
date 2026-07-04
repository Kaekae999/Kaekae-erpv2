import Image from "next/image";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1">
        <Header />

        <div className="p-8">
          <div className="grid grid-cols-4 gap-6">

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-gray-500">Stok Emas</h2>

              <p className="text-3xl font-bold mt-3">
                1.000 gr
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-gray-500">Nilai Persediaan</h2>

              <p className="text-3xl font-bold mt-3">
                Rp17.000.000
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-gray-500">Produksi</h2>

              <p className="text-3xl font-bold mt-3">
                0
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-gray-500">Penjualan</h2>

              <p className="text-3xl font-bold mt-3">
                Rp0
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}