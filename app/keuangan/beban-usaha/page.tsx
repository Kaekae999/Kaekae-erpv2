"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Wallet } from "lucide-react";

interface BusinessType {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  business_type_id: string | null;
  expense_date: string;
  expense_name: string;
  amount: number;
  notes: string | null;
  business_types: { name: string } | null;
}

export default function BebanUsahaPage() {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [businessTypeId, setBusinessTypeId] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const businessResult = await supabase
      .from("business_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    const expenseResult = await supabase
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
      .order("expense_date", { ascending: false })
      .limit(100);

    if (businessResult.data) setBusinessTypes(businessResult.data);
    if (expenseResult.data) setExpenses(expenseResult.data as any);
  }

  async function handleSave() {
    if (!businessTypeId) return alert("Pilih unit bisnis dulu.");
    if (!expenseDate) return alert("Tanggal wajib diisi.");
    if (!expenseName.trim()) return alert("Nama beban wajib diisi.");
    if (Number(amount || 0) <= 0) return alert("Nominal harus lebih dari 0.");

    setIsSaving(true);

    try {
      const { error } = await supabase.from("operating_expenses").insert({
        business_type_id: businessTypeId,
        expense_date: expenseDate,
        expense_name: expenseName.trim(),
        amount: Number(amount || 0),
        notes: notes.trim() || null,
      });

      if (error) throw new Error(error.message);

      alert("Beban usaha berhasil disimpan.");

      setExpenseName("");
      setAmount("");
      setNotes("");

      await loadData();
    } catch (error) {
      alert(
        "Gagal simpan beban usaha: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Hapus beban usaha ini?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("operating_expenses")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal hapus: " + error.message);
      return;
    }

    await loadData();
  }

  const totalBeban = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <Layout>
      <PageHeader
        title="Beban Usaha"
        description="Catat biaya operasional di luar HPP, seperti admin, marketing, transport, dan biaya umum."
        action={
          <Button onClick={handleSave} disabled={isSaving}>
            <Plus size={18} />
            {isSaving ? "Menyimpan..." : "Simpan Beban"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
          <Wallet size={28} className="text-slate-700" />
          <p className="text-sm text-slate-500 mt-4">Total Beban Usaha</p>
          <p className="text-2xl md:text-3xl font-black mt-1">
            Rp {totalBeban.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-6">
        <h2 className="text-lg font-bold mb-5">Input Beban Usaha</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
          <select
            value={businessTypeId}
            onChange={(e) => setBusinessTypeId(e.target.value)}
            className="border rounded-2xl px-4 py-3 w-full"
          >
            <option value="">Pilih Unit Bisnis</option>
            {businessTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="border rounded-2xl px-4 py-3 w-full"
          />

          <input
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            placeholder="Nama beban"
            className="border rounded-2xl px-4 py-3 w-full"
          />

          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Nominal"
            className="border rounded-2xl px-4 py-3 w-full"
          />

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan"
            className="border rounded-2xl px-4 py-3 w-full sm:col-span-2 xl:col-span-1"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b">
          <h2 className="font-bold text-lg">Riwayat Beban Usaha</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Tanggal</th>
                <th className="p-4 text-left">Unit Bisnis</th>
                <th className="p-4 text-left">Beban</th>
                <th className="p-4 text-left">Catatan</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((item) => (
                <tr key={item.id} className="border-t hover:bg-slate-50">
                  <td className="p-4">{item.expense_date}</td>
                  <td className="p-4">{item.business_types?.name || "-"}</td>
                  <td className="p-4 font-semibold">{item.expense_name}</td>
                  <td className="p-4">{item.notes || "-"}</td>
                  <td className="p-4 text-right font-bold">
                    Rp {Number(item.amount || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Belum ada beban usaha.
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
