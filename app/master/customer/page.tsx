"use client";

import CrudPage from "@/components/crud/CrudPage";

interface Customer {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  phone: string;
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
        { header: "Alamat", accessor: "address" },
        { header: "Kota", accessor: "city" },
        { header: "Telepon", accessor: "phone" },
        { header: "PIC", accessor: "contact_person" },
        { header: "Keterangan", accessor: "description" },
      ]}
      fields={[
        {
          name: "code",
          label: "Kode",
          placeholder: "Contoh: CUST-003",
        },
        {
          name: "name",
          label: "Nama Customer",
          placeholder: "Contoh: PT Jepang",
        },
        {
          name: "address",
          label: "Alamat Lengkap",
          placeholder: "Contoh: Jl. Industri No. 10",
        },
        {
          name: "city",
          label: "Kota",
          placeholder: "Contoh: Tokyo",
        },
        {
          name: "phone",
          label: "No. Telepon / WhatsApp",
          placeholder: "Contoh: +81 90 1234 5678",
        },
        {
          name: "contact_person",
          label: "PIC",
          placeholder: "Contoh: Bapak Tanaka",
        },
        {
          name: "description",
          label: "Keterangan",
          placeholder: "Opsional",
        },
      ]}
    />
  );
}
