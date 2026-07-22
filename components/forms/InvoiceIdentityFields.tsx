"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface CompanyOption {
  id: string;
  name: string;
}

interface BankOption {
  id: string;
  company_id: string | null;
  bank_name: string;
  account_number: string;
  account_name: string;
}

interface InvoiceIdentityValue {
  invoice_company_id: string;
  bank_account_id: string;
  due_date: string;
  invoice_notes: string;
  terms_conditions: string;
}

export default function InvoiceIdentityFields({
  value,
  onChange,
}: {
  value: InvoiceIdentityValue;
  onChange: (next: InvoiceIdentityValue) => void;
}) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    const [companyResult, bankResult] = await Promise.all([
      supabase
        .from("companies")
        .select("id, name")
        .order("name"),
      supabase
        .from("bank_accounts")
        .select("id, company_id, bank_name, account_number, account_name")
        .eq("is_active", true)
        .order("is_default", { ascending: false }),
    ]);

    if (companyResult.error) {
      alert("Gagal memuat perusahaan invoice: " + companyResult.error.message);
      return;
    }

    if (bankResult.error) {
      alert("Gagal memuat rekening: " + bankResult.error.message);
      return;
    }

    setCompanies(companyResult.data || []);
    setBanks(bankResult.data || []);
  }

  const matchingBanks = useMemo(() => {
    if (!value.invoice_company_id) return [];

    return banks.filter(
      (bank) => bank.company_id === value.invoice_company_id
    );
  }, [banks, value.invoice_company_id]);

  function update<K extends keyof InvoiceIdentityValue>(
    key: K,
    nextValue: InvoiceIdentityValue[K]
  ) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  function handleCompanyChange(companyId: string) {
    onChange({
      ...value,
      invoice_company_id: companyId,
      bank_account_id: "",
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="mb-5">
        <h3 className="text-lg font-black text-slate-900">
          Identitas Invoice
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Untuk kebutuhan MBG, perusahaan invoice dan rekening dapat dipilih
          berbeda untuk setiap transaksi.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Perusahaan pada Invoice
          </span>
          <select
            value={value.invoice_company_id}
            onChange={(e) => handleCompanyChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          >
            <option value="">Pilih perusahaan invoice</option>
            {companies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Rekening Pembayaran
          </span>
          <select
            value={value.bank_account_id}
            onChange={(e) => update("bank_account_id", e.target.value)}
            disabled={!value.invoice_company_id}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none disabled:bg-slate-100"
          >
            <option value="">Pilih rekening</option>
            {matchingBanks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.bank_name} • {bank.account_number} • {bank.account_name}
              </option>
            ))}
          </select>

          {value.invoice_company_id && matchingBanks.length === 0 && (
            <p className="mt-2 text-xs font-semibold text-amber-700">
              Belum ada rekening aktif yang terhubung ke perusahaan ini.
            </p>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Jatuh Tempo
          </span>
          <input
            type="date"
            value={value.due_date}
            onChange={(e) => update("due_date", e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
          />
        </label>

        <div />

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Catatan Invoice
          </span>
          <textarea
            rows={3}
            value={value.invoice_notes}
            onChange={(e) => update("invoice_notes", e.target.value)}
            placeholder="Contoh: Pengiriman untuk Dapur Jeketro."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Syarat & Ketentuan
          </span>
          <textarea
            rows={3}
            value={value.terms_conditions}
            onChange={(e) => update("terms_conditions", e.target.value)}
            placeholder="Contoh: Pembayaran maksimal 7 hari setelah invoice diterima."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
          />
        </label>
      </div>
    </section>
  );
}