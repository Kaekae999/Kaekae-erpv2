"use client";

import CrudPage from "@/components/crud/CrudPage";

interface Supplier {
  id: string;
  code: string;
  name: string;
  city: string;
  contact_person: string;
  description: string;
}

export default function SupplierPage() {
  return (
    <CrudPage<Supplier>
      title="Supplier"
      description="Kelola data pemasok usaha."
      table="suppliers"
      columns={[
        { header: "Kode", accessor: "code" },
        { header: "Nama Supplier", accessor: "name" },
        { header: "Kota", accessor: "city" },
        { header: "PIC", accessor: "contact_person" },
        { header: "Keterangan", accessor: "description" },
      ]}
      fields={[
        { name: "code", label: "Kode", placeholder: "Contoh: SUP-003" },
        { name: "name", label: "Nama Supplier", placeholder: "Contoh: CV Sumber Rejeki" },
        { name: "city", label: "Kota", placeholder: "Contoh: Semarang" },
        { name: "contact_person", label: "PIC", placeholder: "Contoh: Pak Budi" },
        { name: "description", label: "Keterangan", placeholder: "Opsional" },
      ]}
    />
  );
}
