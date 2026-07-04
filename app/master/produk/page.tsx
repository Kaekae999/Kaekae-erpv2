"use client";

import CrudPage from "@/components/crud/CrudPage";

interface Product {
  id: string;
  code: string;
  name: string;
  business_type_id: string;
  category_id: string;
  unit_id: string;
  purchase_price: number;
  selling_price: number;
  minimum_stock: number;
  description: string;
}

export default function ProdukPage() {
  return (
    <CrudPage<Product>
      title="Produk"
      description="Kelola master produk untuk semua unit bisnis."
      table="products"
      columns={[
        { header: "Kode", accessor: "code" },
        { header: "Nama Produk", accessor: "name" },
        { header: "Harga Beli", accessor: "purchase_price", type: "currency" },
        { header: "Harga Jual", accessor: "selling_price", type: "currency" },
        { header: "Min. Stok", accessor: "minimum_stock", type: "number" },
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
        {
          name: "category_id",
          label: "Kategori",
          type: "select",
          table: "categories",
          value: "id",
          text: "name",
        },
        {
          name: "unit_id",
          label: "Satuan",
          type: "select",
          table: "units",
          value: "id",
          text: "name",
        },
        {
          name: "code",
          label: "Kode Produk",
          placeholder: "PRD-001",
        },
        {
          name: "name",
          label: "Nama Produk",
          placeholder: "Nama Produk",
        },
        {
          name: "purchase_price",
          label: "Harga Beli",
          placeholder: "0",
          type: "currency",
        },
        {
          name: "selling_price",
          label: "Harga Jual",
          placeholder: "0",
          type: "currency",
        },
        {
          name: "minimum_stock",
          label: "Minimum Stok",
          placeholder: "0",
          type: "number",
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
