"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { Building2, Save } from "lucide-react";

export default function ProfilPerusahaanPage() {
  const [profileId, setProfileId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    address: "",
    city: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    npwp: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    logo_url: "",
    qris_url: "",
    signature_url: "",
    footer_note: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      alert("Gagal load profil: " + error.message);
      return;
    }

    if (data) {
      setProfileId(data.id);

      setForm({
        company_name: data.company_name || "",
        address: data.address || "",
        city: data.city || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        email: data.email || "",
        website: data.website || "",
        npwp: data.npwp || "",
        bank_name: data.bank_name || "",
        bank_account_number: data.bank_account_number || "",
        bank_account_name: data.bank_account_name || "",
        logo_url: data.logo_url || "",
        qris_url: data.qris_url || "",
        signature_url: data.signature_url || "",
        footer_note: data.footer_note || "",
      });
    }
  }

  function handleChange(name: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSave() {
    if (!form.company_name.trim()) {
      alert("Nama perusahaan wajib diisi.");
      return;
    }

    setIsSaving(true);

    const payload = {
      company_name: form.company_name,
      address: form.address,
      city: form.city,
      phone: form.phone,
      whatsapp: form.whatsapp,
      email: form.email,
      website: form.website,
      npwp: form.npwp,
      bank_name: form.bank_name,
      bank_account_number: form.bank_account_number,
      bank_account_name: form.bank_account_name,
      logo_url: form.logo_url,
      qris_url: form.qris_url,
      signature_url: form.signature_url,
      footer_note: form.footer_note,
      is_active: true,
    };

    const { data, error } = profileId
      ? await supabase
          .from("company_profiles")
          .update(payload)
          .eq("id", profileId)
          .select()
          .single()
      : await supabase
          .from("company_profiles")
          .insert(payload)
          .select()
          .single();

    setIsSaving(false);

    if (error) {
      alert("Gagal simpan profil: " + error.message);
      return;
    }

    if (data) setProfileId(data.id);

    alert("Profil perusahaan berhasil disimpan.");
  }

  return (
    <Layout>
      <PageHeader
        title="Profil Perusahaan"
        description="Kelola identitas perusahaan untuk invoice dan dokumen."
        action={
          <Button onClick={handleSave} disabled={isSaving}>
            <Save size={20} />
            {isSaving ? "Menyimpan..." : "Simpan Profil"}
          </Button>
        }
      />

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Identitas Perusahaan</h2>
                <p className="text-sm text-slate-500">
                  Data utama yang tampil pada dokumen.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Field
                label="Nama Perusahaan"
                value={form.company_name}
                onChange={(value) => handleChange("company_name", value)}
                placeholder="Kaekae"
              />

              <Field
                label="Kota"
                value={form.city}
                onChange={(value) => handleChange("city", value)}
                placeholder="Semarang"
              />

              <div className="md:col-span-2">
                <TextArea
                  label="Alamat"
                  value={form.address}
                  onChange={(value) => handleChange("address", value)}
                  placeholder="Alamat lengkap perusahaan"
                />
              </div>

              <Field
                label="Telepon"
                value={form.phone}
                onChange={(value) => handleChange("phone", value)}
                placeholder="024..."
              />

              <Field
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(value) => handleChange("whatsapp", value)}
                placeholder="08..."
              />

              <Field
                label="Email"
                value={form.email}
                onChange={(value) => handleChange("email", value)}
                placeholder="email@kaekae.com"
              />

              <Field
                label="Website"
                value={form.website}
                onChange={(value) => handleChange("website", value)}
                placeholder="www.kaekae.com"
              />

              <Field
                label="NPWP"
                value={form.npwp}
                onChange={(value) => handleChange("npwp", value)}
                placeholder="Opsional"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-1">Informasi Bank</h2>
            <p className="text-sm text-slate-500 mb-6">
              Rekening yang tampil pada invoice.
            </p>

            <div className="grid md:grid-cols-2 gap-5">
              <Field
                label="Nama Bank"
                value={form.bank_name}
                onChange={(value) => handleChange("bank_name", value)}
                placeholder="Bank Jateng"
              />

              <Field
                label="No Rekening"
                value={form.bank_account_number}
                onChange={(value) =>
                  handleChange("bank_account_number", value)
                }
                placeholder="0000000000"
              />

              <div className="md:col-span-2">
                <Field
                  label="Atas Nama"
                  value={form.bank_account_name}
                  onChange={(value) =>
                    handleChange("bank_account_name", value)
                  }
                  placeholder="Zea Boga Elnas"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-1">Dokumen & Media</h2>
            <p className="text-sm text-slate-500 mb-6">
              Untuk sementara isi dengan URL gambar. Upload file kita buat di
              sprint berikutnya.
            </p>

            <div className="grid md:grid-cols-2 gap-5">
              <Field
                label="Logo URL"
                value={form.logo_url}
                onChange={(value) => handleChange("logo_url", value)}
                placeholder="https://..."
              />

              <Field
                label="QRIS URL"
                value={form.qris_url}
                onChange={(value) => handleChange("qris_url", value)}
                placeholder="https://..."
              />

              <div className="md:col-span-2">
                <Field
                  label="Tanda Tangan URL"
                  value={form.signature_url}
                  onChange={(value) => handleChange("signature_url", value)}
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Footer Invoice"
                  value={form.footer_note}
                  onChange={(value) => handleChange("footer_note", value)}
                  placeholder="Terima kasih atas kepercayaan Anda."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 h-fit">
          <h2 className="text-lg font-bold mb-4">Preview Singkat</h2>

          <div className="border rounded-3xl p-5 bg-slate-50">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl mb-4">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                "K"
              )}
            </div>

            <h3 className="text-xl font-black">
              {form.company_name || "Kaekae"}
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              {form.address || "Alamat perusahaan"}
            </p>

            <div className="mt-5 space-y-2 text-sm">
              <p>
                <span className="text-slate-500">Telp:</span>{" "}
                {form.phone || "-"}
              </p>
              <p>
                <span className="text-slate-500">Email:</span>{" "}
                {form.email || "-"}
              </p>
              <p>
                <span className="text-slate-500">Bank:</span>{" "}
                {form.bank_name || "-"}
              </p>
              <p>
                <span className="text-slate-500">Rek:</span>{" "}
                {form.bank_account_number || "-"}
              </p>
            </div>

            <div className="border-t mt-5 pt-4 text-xs text-slate-500">
              {form.footer_note || "Footer invoice akan tampil di sini."}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-amber-500"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-amber-500 resize-none"
      />
    </div>
  );
}