"use client";

import CrudPage from "@/components/crud/CrudPage";

interface Warehouse {
  id: string;
  code: string;
  name: string;
  city: string;
  pic: string;
  description: string;
}

export default function GudangPage() {
  return (
    <CrudPage<Warehouse>
      title="Gudang"
      description="Kelola lokasi penyimpanan barang."
      table="warehouses"
      columns={[
        { header: "Kode", accessor: "code" },
        { header: "Nama Gudang", accessor: "name" },
        { header: "Kota", accessor: "city" },
        { header: "PIC", accessor: "pic" },
        { header: "Keterangan", accessor: "description" },
      ]}
      fields={[
        { name: "code", label: "Kode", placeholder: "Contoh: GDG-001" },
        { name: "name", label: "Nama Gudang", placeholder: "Contoh: Gudang Utama" },
        { name: "city", label: "Kota", placeholder: "Contoh: Semarang" },
        { name: "pic", label: "PIC", placeholder: "Contoh: Zea" },
        { name: "description", label: "Keterangan", placeholder: "Opsional" },
      ]}
    />
  );
}