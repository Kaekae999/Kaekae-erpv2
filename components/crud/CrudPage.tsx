"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable from "@/components/table/DataTable";
import Input from "@/components/ui/Input";
import FormModal from "@/components/forms/FormModal";
import { supabase } from "@/lib/supabase";
import { Plus, Search } from "lucide-react";

interface Column<T> {
  header: string;
  accessor: keyof T;
  className?: string;
  type?: "text" | "number" | "currency";
}

interface Field {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "currency" | "select";
  table?: string;
  value?: string;
  text?: string;
}

interface Props<T extends { id: string }> {
  title: string;
  description: string;
  table: string;
  columns: Column<T>[];
  fields?: Field[];
}

export default function CrudPage<T extends { id: string }>({
  title,
  description,
  table,
  columns,
  fields = [],
}: Props<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<Record<string, any[]>>({});

  async function loadData() {
    setLoading(true);

    let query = supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });

    if (search.trim() !== "") {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (!error && data) setData(data as T[]);

    setLoading(false);
  }

  async function loadOptions() {
    const selectFields = fields.filter((field) => field.type === "select");

    const nextOptions: Record<string, any[]> = {};

    for (const field of selectFields) {
      if (!field.table) continue;

      const valueKey = field.value || "id";
      const textKey = field.text || "name";

      const { data, error } = await supabase
        .from(field.table)
        .select(`${valueKey}, ${textKey}`)
        .order(textKey);

      if (!error && data) {
        nextOptions[field.name] = data;
      }
    }

    setOptions(nextOptions);
  }

  useEffect(() => {
    loadData();
  }, [search]);

  useEffect(() => {
    loadOptions();
  }, []);

  function handleChange(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAdd() {
    setEditingId(null);
    setForm({});
    setOpen(true);
  }

  function handleEdit(row: T) {
    setEditingId(row.id);

    const nextForm: Record<string, string> = {};

    fields.forEach((field) => {
      const value = row[field.name as keyof T];
      nextForm[field.name] =
        value === null || value === undefined ? "" : String(value);
    });

    setForm(nextForm);
    setOpen(true);
  }

  function preparePayload() {
    const payload: Record<string, any> = {};

    fields.forEach((field) => {
      const value = form[field.name];

      if (value === "" || value === undefined) {
        payload[field.name] = null;
        return;
      }

      if (field.type === "number" || field.type === "currency") {
        payload[field.name] = Number(value);
        return;
      }

      payload[field.name] = value;
    });

    return payload;
  }

  async function handleSave() {
    if (fields.length === 0) {
      alert("Field form belum disetting untuk halaman ini.");
      return;
    }

    const payload = preparePayload();

    const { error } = editingId
      ? await supabase.from(table).update(payload).eq("id", editingId)
      : await supabase.from(table).insert(payload);

    if (error) {
      alert("Gagal simpan: " + error.message);
      return;
    }

    setForm({});
    setEditingId(null);
    setOpen(false);
    loadData();
  }

  async function handleDelete(row: T) {
    const yakin = confirm("Yakin hapus data ini?");

    if (!yakin) return;

    const { error } = await supabase.from(table).delete().eq("id", row.id);

    if (error) {
      alert("Gagal hapus: " + error.message);
      return;
    }

    loadData();
  }

  return (
    <Layout>
      <PageHeader
        title={title}
        description={description}
        action={
          <Button onClick={handleAdd}>
            <Plus size={20} />
            Tambah {title}
          </Button>
        }
      />

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 md:p-5 mb-6">
        <div className="flex items-center gap-3 border border-slate-300 rounded-2xl px-4 focus-within:border-amber-500">
          <Search size={18} className="text-slate-400 shrink-0" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Cari ${title}...`}
            className="w-full py-3 outline-none text-sm md:text-base"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 text-slate-500">
          Memuat data...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={data}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      <FormModal
        open={open}
        title={editingId ? `Edit ${title}` : `Tambah ${title}`}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          {fields.map((field) => {
            if (field.type === "select") {
              const valueKey = field.value || "id";
              const textKey = field.text || "name";
              const fieldOptions = options[field.name] || [];

              return (
                <div key={field.name}>
                  <label className="block text-sm font-semibold mb-2">
                    {field.label}
                  </label>

                  <select
                    value={form[field.name] ?? ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-amber-500"
                  >
                    <option value="">Pilih {field.label}</option>

                    {fieldOptions.map((option) => (
                      <option key={option[valueKey]} value={option[valueKey]}>
                        {option[textKey]}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <Input
                key={field.name}
                label={field.label}
                placeholder={field.placeholder}
                value={form[field.name] ?? ""}
                onChange={(value) => handleChange(field.name, value)}
              />
            );
          })}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <button
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-300 font-semibold"
            >
              Batal
            </button>

            <div className="w-full sm:w-auto">
              <Button onClick={handleSave}>
                {editingId ? "Update" : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      </FormModal>
    </Layout>
  );
}
