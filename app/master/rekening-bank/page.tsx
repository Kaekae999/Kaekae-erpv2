"use client";

import CrudPage from "@/components/crud/CrudPage";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  business_type_id: string;
  is_default: boolean;
}

export default function RekeningBankPage() {
  return (
    <CrudPage<BankAccount>
      title="Rekening Bank"
      description="Kelola rekening pembayaran untuk invoice dan dokumen."
      table="bank_accounts"
      columns={[
        { header: "Bank", accessor: "bank_name" },
        { header: "No Rekening", accessor: "account_number" },
        { header: "Atas Nama", accessor: "account_name" },
        { header: "Default", accessor: "is_default" },
      ]}
      fields={[
        {
          name: "business_type_id",
          label: "Unit Bisnis",
          type: "select",
          table: "business_types",
          value: "id",
          text: "name",
        },
        {
          name: "bank_name",
          label: "Nama Bank",
          placeholder: "Contoh: Bank Jateng",
        },
        {
          name: "account_number",
          label: "No Rekening",
          placeholder: "Contoh: 1234567890",
        },
        {
          name: "account_name",
          label: "Atas Nama",
          placeholder: "Contoh: Kaekae",
        },
        {
          name: "is_default",
          label: "Default",
          placeholder: "true / false",
        },
      ]}
    />
  );
}