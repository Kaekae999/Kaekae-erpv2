"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, WalletCards } from "lucide-react";

interface BusinessType {
  id: string;
  name: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  business_type_id: string | null;
}

interface CashTransaction {
  id: string;
  business_type_id: string | null;
  bank_account_id: string | null;
  transaction_date: string;
  transaction_type: string;
  description: string;
  amount: number;
  notes: string | null;
  business_types: { name: string } | null;
  bank_accounts: {
    bank_name: string;
    account_number: string;
    account_name: string;
  } | null;
}

const transactionTypes = [
  { value: "MODAL_MASUK", label: "Modal Masuk", flow: "MASUK" },
  { value: "PEMASUKAN_LAIN", label: "Pemasukan Lain", flow: "MASUK" },
  { value: "TRANSFER_MASUK", label: "Transfer Masuk", flow: "MASUK" },
  { value: "PENARIKAN_PRIBADI", label: "Penarikan Pribadi", flow: "KELUAR" },
  { value: "PENGELUARAN_LAIN", label: "Pengeluaran Lain", flow: "KELUAR" },
  { value: "TRANSFER_KELUAR", label: "Transfer Keluar", flow: "KELUAR" },
];

export default function TransaksiKasPage() {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);

  const [businessTypeId, setBusinessTypeId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [transactionType, setTransactionType] = useState("MODAL_MASUK");
  const [description, setDescription] = useState("");
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

    const bankResult = await supabase
      .from("bank_accounts")
      .select("id, bank_name, account_number, account_name, business_type_id")
      .order("bank_name");

    const transactionResult = await supabase
      .from("cash_transactions")
      .select(`
        id,
        business_type_id,
        bank_account_id,
        transaction_date,
        transaction_type,
        description,
        amount,
        notes,
        business_types(name),
        bank_accounts(bank_name, account_number, account_name)
      `)
      .order("transaction_date", { ascending: false })
      .limit(100);

    if (businessResult.data) setBusinessTypes(businessResult.data);
    if (bankResult.data) setBankAccounts(bankResult.data as any);
    if (transactionResult.data) setTransactions(transactionResult.data as any);
  }

  async function handleSave() {
    if (!businessTypeId) return alert("Pilih unit bisnis dulu.");
    if (!bankAccountId) return alert("Pilih rekening dulu.");
    if (!transactionDate) return alert("Tanggal wajib diisi.");
    if (!description.trim()) return alert("Keterangan wajib diisi.");
    if (Number(amount || 0) <= 0) return alert("Nominal harus lebih dari 0.");

    setIsSaving(true);

    try {
      const { error } = await supabase.from("cash_transactions").insert({
        business_type_id: businessTypeId,
        bank_account_id: bankAccountId,
        transaction_date: transactionDate,
        transaction_type: transactionType,
        description: description.trim(),
        amount: Number(amount || 0),
        notes: notes.trim() || null,
      });

      if (error) throw new Error(error.message);

      alert("Transaksi kas berhasil disimpan.");

      setDescription("");
      setAmount("");
      setNotes("");

      await loadData();
    } catch (error) {
      alert(
        "Gagal simpan transaksi kas: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Hapus transaksi kas ini?");
    if (!confirmed) return;

    const { error } = await supabase.from("cash_transactions").delete().eq("id", id);

    if (error) {
      alert("Gagal hapus transaksi kas: " + error.message);
      return;
    }

    await loadData();
  }

  function isCashIn(type: string) {
    return ["MODAL_MASUK", "PEMASUKAN_LAIN", "TRANSFER_MASUK"].includes(type);
  }

  const totalMasuk = transactions
    .filter((item) => isCashIn(item.transaction_type))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalKeluar = transactions
    .filter((item) => !isCashIn(item.transaction_type))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const saldoManual = totalMasuk - totalKeluar;

  return (
    <Layout>
      <PageHeader
        title="Transaksi Kas"
        description="Catat transaksi kas manual seperti modal masuk, penarikan pribadi, transfer, pemasukan, dan pengeluaran lain."
        action={
          <Button onClick={handleSave} disabled={isSaving}>
            <Plus size={18} />
            {isSaving ? "Menyimpan..." : "Simpan Kas"}
          </Button>
        }
      />

      <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <WalletCards size={28} className="text-slate-700" />
          <p className="text-sm text-slate-500 mt-4">Kas Masuk Manual</p>
          <p className="text-3xl font-black mt-1">
            Rp {totalMasuk.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <WalletCards size={28} className="text-slate-700" />
          <p className="text-sm text-slate-500 mt-4">Kas Keluar Manual</p>
          <p className="text-3xl font-black mt-1">
            Rp {totalKeluar.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-slate-950 text-white rounded-3xl p-6">
          <WalletCards size={28} />
          <p className="text-sm text-slate-300 mt-4">Saldo Manual</p>
          <p className="text-3xl font-black mt-1">
            Rp {saldoManual.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold mb-5">Input Transaksi Kas</h2>

        <div className="grid lg:grid-cols-4 gap-4 mb-4">
          <select
            value={businessTypeId}
            onChange={(e) => setBusinessTypeId(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          >
            <option value="">Pilih Unit Bisnis</option>
            {businessTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          >
            <option value="">Pilih Rekening</option>
            {bankAccounts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.bank_name} - {item.account_number}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          />

          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          >
            {transactionTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Keterangan transaksi"
            className="border rounded-2xl px-4 py-3"
          />

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Nominal"
            className="border rounded-2xl px-4 py-3"
          />

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan"
            className="border rounded-2xl px-4 py-3"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b">
          <h2 className="font-bold text-lg">Riwayat Transaksi Kas</h2>
        </div>

        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-left">Tanggal</th>
              <th className="p-4 text-left">Unit Bisnis</th>
              <th className="p-4 text-left">Rekening</th>
              <th className="p-4 text-left">Jenis</th>
              <th className="p-4 text-left">Keterangan</th>
              <th className="p-4 text-right">Nominal</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50">
                <td className="p-4">{item.transaction_date}</td>
                <td className="p-4">{item.business_types?.name || "-"}</td>
                <td className="p-4">
                  {item.bank_accounts
                    ? `${item.bank_accounts.bank_name} - ${item.bank_accounts.account_number}`
                    : "-"}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isCashIn(item.transaction_type)
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {transactionTypes.find((type) => type.value === item.transaction_type)
                      ?.label || item.transaction_type}
                  </span>
                </td>
                <td className="p-4 font-semibold">{item.description}</td>
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

            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Belum ada transaksi kas manual.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
