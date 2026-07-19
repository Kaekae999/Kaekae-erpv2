"use client";

import CrudPage from "@/components/crud/CrudPage";

interface Company {
  id: string;
  code: string;
  name: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  tax_number: string;
  registration_number: string;
  logo_url: string;
  footer_text: string;
}

export default function PerusahaanPage() {
  return (
    <CrudPage<Company>
      title="Perusahaan"
      description="Kelola identitas perusahaan untuk transaksi dan invoice."
      table="companies"
      columns={[
        { header: "Kode", accessor: "code" },
        { header: "Nama Perusahaan", accessor: "name" },
        { header: "Tagline", accessor: "tagline" },
        { header: "Kota", accessor: "city" },
        { header: "Telepon", accessor: "phone" },
        { header: "Email", accessor: "email" },
      ]}
      fields={[
        { name: "code", label: "Kode Perusahaan", placeholder: "Contoh: KUSUMO-BOGA" },
        { name: "name", label: "Nama Perusahaan", placeholder: "Contoh: KUSUMO BOGA" },
        { name: "tagline", label: "Tagline", placeholder: "Contoh: Mitra Setia Anda" },
        { name: "address", label: "Alamat", placeholder: "Alamat lengkap perusahaan" },
        { name: "city", label: "Kota", placeholder: "Contoh: Semarang" },
        { name: "phone", label: "Telepon / WhatsApp", placeholder: "Contoh: 081234567890" },
        { name: "email", label: "Email", placeholder: "Contoh: admin@perusahaan.com" },
        { name: "tax_number", label: "NPWP", placeholder: "Opsional" },
        { name: "registration_number", label: "NIB / Nomor Registrasi", placeholder: "Opsional" },
        { name: "logo_url", label: "URL Logo", placeholder: "Opsional" },
        { name: "footer_text", label: "Footer Invoice", placeholder: "Terima kasih atas kepercayaan Anda." },
      ]}
    />
  );
}