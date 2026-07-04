"use client";

import CrudPage from "@/components/crud/CrudPage";

interface Customer {
  id: string;
  code: string;
  name: string;
  city: string;
  contact_person: string;
  description: string;
}

export default function CustomerPage() {
  return (
    <CrudPage<Customer>
      title="Customer"
      description="Kelola data pelanggan."
      table="customers"
      columns={[
        { header: "Kode", accessor: "code" },
        { header: "Nama Customer", accessor: "name" },
        { header: "Kota", accessor: "city" },
        { header: "PIC", accessor: "contact_person" },
        { header: "Keterangan", accessor: "description" },
      ]}
      fields={[
        { name: "code", label: "Kode", placeholder: "Contoh: CUST-003" },
        { name: "name", label: "Nama Customer", placeholder: "Contoh: Dapur Sehat" },
        { name: "city", label: "Kota", placeholder: "Contoh: Purwodadi" },
        { name: "contact_person", label: "PIC", placeholder: "Contoh: Pak Baskoro" },
        { name: "description", label: "Keterangan", placeholder: "Opsional" },
      ]}
    />
  );
}