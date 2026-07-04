"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";

interface BusinessType {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export default function JenisUsahaPage() {
  const [data, setData] = useState<BusinessType[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data, error } = await supabase
      .from("business_types")
      .select("id, code, name, description")
      .order("name");

    if (!error && data) setData(data);
  }

  async function handleSave() {
    if (!code || !name) {
      alert("Kode dan nama unit usaha wajib diisi.");
      return;
    }

    const { error } = await supabase.from("business_types").insert({
      code: code.toUpperCase(),
      name,
      description,
    });

    if (error) {
      alert("Gagal simpan: " + error.message);
      return;
    }

    setCode("");
    setName("");
    setDescription("");
    loadData();
    alert("Unit bisnis berhasil ditambahkan.");
  }

  async function handleDelete(id: string) {
    const yakin = confirm("Hapus unit bisnis ini?");
    if (!yakin) return;

    const { error } = await supabase
      .from("business_types")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal hapus: " + error.message);
      return;
    }

    loadData();
  }

  return (
    <Layout>
      <PageHeader
        title="Unit Bisnis"
        description="Kelola lini usaha seperti Beras, Emas, Susu, Gading, dan lainnya."
        action={
          <Button onClick={handleSave}>
            <Plus size={20} />
            Simpan
          </Button>
        }
      />

      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Tambah Unit Bisnis</h2>

        <div className="grid grid-cols-3 gap-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Kode, contoh: BERAS"
            className="border rounded-2xl px-4 py-3"
          />

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama, contoh: Beras"
            className="border rounded-2xl px-4 py-3"
          />

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi"
            className="border rounded-2xl px-4 py-3"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b">
          <h2 className="font-bold text-lg">Daftar Unit Bisnis</h2>
        </div>

        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-left">Kode</th>
              <th className="p-4 text-left">Nama</th>
              <th className="p-4 text-left">Deskripsi</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50">
                <td className="p-4 font-semibold">{item.code}</td>
                <td className="p-4">{item.name}</td>
                <td className="p-4">{item.description || "-"}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Belum ada unit usaha.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}