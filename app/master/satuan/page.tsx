"use client";

import CrudPage from "@/components/crud/CrudPage";

interface Unit {
  id: string;
  code: string;
  name: string;
  symbol: string;
  description: string;
}

export default function SatuanPage() {
  return (
    <CrudPage<Unit>
      title="Satuan"
      description="Kelola satuan produk."
      table="units"
      columns={[
        { header: "Kode", accessor: "code" },
        { header: "Nama Satuan", accessor: "name" },
        { header: "Simbol", accessor: "symbol" },
        { header: "Keterangan", accessor: "description" },
      ]}
      fields={[
        { name: "code", label: "Kode", placeholder: "Contoh: KG" },
        { name: "name", label: "Nama Satuan", placeholder: "Contoh: Kilogram" },
        { name: "symbol", label: "Simbol", placeholder: "Contoh: kg" },
        { name: "description", label: "Keterangan", placeholder: "Opsional" },
      ]}
    />
  );
}