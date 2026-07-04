"use client";

import CrudPage from "@/components/crud/CrudPage";

interface Category {
  id: string;
  business_type_id: string;
  code: string;
  name: string;
  description: string;
}

export default function KategoriPage() {
  return (
    <CrudPage<Category>
      title="Kategori"
      description="Kelola kategori produk berdasarkan unit bisnis."
      table="categories"
      columns={[
        { header: "Kode", accessor: "code" },
        { header: "Nama Kategori", accessor: "name" },
        { header: "Keterangan", accessor: "description" },
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
        { name: "code", label: "Kode", placeholder: "Contoh: BERAS" },
        { name: "name", label: "Nama Kategori", placeholder: "Contoh: Beras Premium" },
        { name: "description", label: "Keterangan", placeholder: "Opsional" },
      ]}
    />
  );
}