"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { SalesService } from "@/services/sales.service";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import InvoiceIdentityFields from "@/components/forms/InvoiceIdentityFields";

interface Customer {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  units?: { name: string } | null;
}

interface SalesItem {
  product_id: string;
  product_name: string;
  unit_name: string;
  qty: number;
  price: number;
  subtotal: number;
}

interface SalesHistory {
  id: string;
  transaction_number: string;
  transaction_date: string;
  customer_id: string;
  warehouse_id: string;
  company_id: string;
  invoice_company_id: string | null;
  bank_account_id: string | null;
  due_date: string | null;
  invoice_notes: string | null;
  terms_conditions: string | null;
  subtotal_amount: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  grand_total: number;
  total_amount: number;
  status: string;
  customers: { name: string } | null;
  warehouses: { name: string } | null;
  companies: { name: string } | null;
}

type DiscountType = "nominal" | "percent";
type TaxMode = "none" | "11" | "custom";

function generateTransactionNumber() {
  return `PJ-${new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "")}-${String(Date.now()).slice(-4)}`;
}

export default function PenjualanPage() {
  const { company, companies } = useWorkspace();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesHistory[]>([]);

  const [transactionNumber, setTransactionNumber] = useState(
    generateTransactionNumber()
  );
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [salesDate, setSalesDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [invoiceIdentity, setInvoiceIdentity] = useState({
    invoice_company_id: "",
    bank_account_id: "",
    due_date: "",
    invoice_notes: "",
    terms_conditions: "",
  });

  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState<SalesItem[]>([]);

  const [discountType, setDiscountType] = useState<DiscountType>("nominal");
  const [discountValue, setDiscountValue] = useState("");
  const [taxMode, setTaxMode] = useState<TaxMode>("none");
  const [customTaxPercent, setCustomTaxPercent] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadSalesHistory();
  }, [company]);

  useEffect(() => {
    if (!company) return;

    setInvoiceIdentity((prev) => ({
      ...prev,
      invoice_company_id: prev.invoice_company_id || company,
    }));
  }, [company]);

  async function loadMasterData() {
    const customerResult = await supabase
      .from("customers")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    const warehouseResult = await supabase
      .from("warehouses")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    const productResult = await supabase
      .from("products")
      .select(`
        id,
        name,
        selling_price,
        units(name)
      `)
      .eq("is_active", true)
      .order("name");

    if (customerResult.data) setCustomers(customerResult.data);
    if (warehouseResult.data) setWarehouses(warehouseResult.data);
    if (productResult.data) setProducts(productResult.data as any);
  }

  async function loadSalesHistory() {
    let query = supabase
      .from("sales_headers")
      .select(`
        id,
        transaction_number,
        transaction_date,
        customer_id,
        warehouse_id,
        company_id,
        invoice_company_id,
        bank_account_id,
        due_date,
        invoice_notes,
        terms_conditions,
        subtotal_amount,
        discount_amount,
        tax_percent,
        tax_amount,
        grand_total,
        total_amount,
        status,
        customers(name),
        warehouses(name),
        companies(name)
      `);

    if (company) {
      query = query.eq("company_id", company);
    }

    const { data, error } = await query
      .order("transaction_date", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Gagal mengambil riwayat penjualan:", error.message);
      return;
    }

    setSalesHistory((data || []) as any);
  }

  function resetForm() {
    setTransactionNumber(generateTransactionNumber());
    setCustomerId("");
    setWarehouseId("");
    setSalesDate(new Date().toISOString().split("T")[0]);
    setSelectedProduct("");
    setQty("");
    setPrice("");
    setItems([]);
    setDiscountType("nominal");
    setDiscountValue("");
    setTaxMode("none");
    setCustomTaxPercent("");
    setInvoiceIdentity({
      invoice_company_id: company || "",
      bank_account_id: "",
      due_date: "",
      invoice_notes: "",
      terms_conditions: "",
    });
  }

  function handleProductChange(productId: string) {
    setSelectedProduct(productId);

    const product = products.find((item) => item.id === productId);
    setPrice(product ? String(product.selling_price || 0) : "");
  }

  function handleAddItem() {
    const product = products.find((item) => item.id === selectedProduct);

    if (!product) return alert("Pilih produk terlebih dahulu.");

    const qtyNumber = Number(qty || 0);
    const priceNumber = Number(price || 0);

    if (qtyNumber <= 0) return alert("Qty harus lebih dari 0.");
    if (priceNumber <= 0) return alert("Harga jual harus lebih dari 0.");

    const unitName = product.units?.name || "-";

    const existingIndex = items.findIndex(
      (item) => item.product_id === product.id && item.price === priceNumber
    );

    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((item, index) => {
          if (index !== existingIndex) return item;

          const newQty = item.qty + qtyNumber;

          return {
            ...item,
            qty: newQty,
            subtotal: newQty * item.price,
          };
        })
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          unit_name: unitName,
          qty: qtyNumber,
          price: priceNumber,
          subtotal: qtyNumber * priceNumber,
        },
      ]);
    }

    setSelectedProduct("");
    setQty("");
    setPrice("");
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  const subtotalInput = Number(qty || 0) * Number(price || 0);

  const subtotalBarang = items.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );

  const nilaiDiskonInput = Math.max(0, Number(discountValue || 0));

  const totalDiskon =
    discountType === "percent"
      ? Math.min(subtotalBarang, subtotalBarang * (Math.min(nilaiDiskonInput, 100) / 100))
      : Math.min(subtotalBarang, nilaiDiskonInput);

  const dpp = Math.max(0, subtotalBarang - totalDiskon);

  const persenPajak =
    taxMode === "none"
      ? 0
      : taxMode === "11"
      ? 11
      : Math.max(0, Number(customTaxPercent || 0));

  const totalPajak = dpp * (persenPajak / 100);
  const grandTotal = dpp + totalPajak;

  async function handleSaveSales() {
    if (!company) return alert("Perusahaan aktif wajib dipilih.");
    if (!salesDate) return alert("Tanggal penjualan wajib diisi.");
    if (!customerId) return alert("Customer wajib dipilih.");
    if (!warehouseId) return alert("Gudang wajib dipilih.");
    if (!invoiceIdentity.invoice_company_id) {
      return alert("Perusahaan pada invoice wajib dipilih.");
    }
    if (!invoiceIdentity.bank_account_id) {
      return alert("Rekening pembayaran wajib dipilih.");
    }
    if (items.length === 0) return alert("Detail barang masih kosong.");

    setIsSaving(true);

    try {
      await SalesService.saveSales({
        company_id: company,
        invoice_company_id: invoiceIdentity.invoice_company_id,
        bank_account_id: invoiceIdentity.bank_account_id || null,
        due_date: invoiceIdentity.due_date || null,
        invoice_notes: invoiceIdentity.invoice_notes || null,
        terms_conditions: invoiceIdentity.terms_conditions || null,
        transaction_number: transactionNumber,
        transaction_date: salesDate,
        customer_id: customerId,
        warehouse_id: warehouseId,
        items: items.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal,
          unit_name: item.unit_name,
        })),
        discount_amount: totalDiskon,
        tax_percent: persenPajak,
        tax_amount: totalPajak,
        grand_total: grandTotal,
      });

      alert("Penjualan berhasil disimpan. Stok dan nilai invoice telah diperbarui.");

      resetForm();
      await loadSalesHistory();
    } catch (error) {
      alert(
        "Gagal simpan penjualan: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancelSales(salesId: string, transactionNumberText: string) {
    const confirmed = window.confirm(
      `Batalkan penjualan ${transactionNumberText}?\n\nStok dari transaksi ini akan dikembalikan.`
    );

    if (!confirmed) return;

    setIsProcessing(salesId);

    try {
      await SalesService.cancelSales(salesId);

      alert(`Penjualan ${transactionNumberText} berhasil dibatalkan dan stok telah dikembalikan.`);

      await loadSalesHistory();
    } catch (error) {
      alert(
        "Gagal membatalkan penjualan: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleEditSales(sale: SalesHistory) {
    const confirmed = window.confirm(
      sale.status === "CANCELLED"
        ? `Gunakan data ${sale.transaction_number} sebagai draft baru?`
        : `Edit penjualan ${sale.transaction_number}?\n\nTransaksi lama akan dibatalkan dulu, stok dikembalikan, lalu datanya dimasukkan ke form untuk disimpan ulang.`
    );

    if (!confirmed) return;

    setIsProcessing(sale.id);

    try {
      const { data: details, error: detailError } = await supabase
        .from("sales_details")
        .select(`
          product_id,
          qty,
          price,
          subtotal,
          unit_name,
          products(name)
        `)
        .eq("sales_id", sale.id);

      if (detailError) throw new Error(detailError.message);

      if (sale.status !== "CANCELLED") {
        await SalesService.cancelSales(sale.id);
      }

      setTransactionNumber(generateTransactionNumber());
      setSalesDate(sale.transaction_date);
      setCustomerId(sale.customer_id || "");
      setWarehouseId(sale.warehouse_id || "");
      setInvoiceIdentity({
        invoice_company_id: sale.invoice_company_id || sale.company_id || company || "",
        bank_account_id: sale.bank_account_id || "",
        due_date: sale.due_date || "",
        invoice_notes: sale.invoice_notes || "",
        terms_conditions: sale.terms_conditions || "",
      });

      setItems(
        ((details || []) as any[]).map((detail) => ({
          product_id: detail.product_id,
          product_name: detail.products?.name || "-",
          unit_name: detail.unit_name || "-",
          qty: Number(detail.qty || 0),
          price: Number(detail.price || 0),
          subtotal: Number(detail.subtotal || 0),
        }))
      );

      const discountAmount = Number(sale.discount_amount || 0);
      setDiscountType("nominal");
      setDiscountValue(discountAmount > 0 ? String(discountAmount) : "");

      const taxPercent = Number(sale.tax_percent || 0);
      if (taxPercent === 0) {
        setTaxMode("none");
        setCustomTaxPercent("");
      } else if (taxPercent === 11) {
        setTaxMode("11");
        setCustomTaxPercent("");
      } else {
        setTaxMode("custom");
        setCustomTaxPercent(String(taxPercent));
      }

      alert("Data penjualan sudah masuk ke form. Silakan adjust, lalu klik Simpan Penjualan.");

      await loadSalesHistory();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      alert(
        "Gagal memuat data penjualan: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleDeleteSales(sale: SalesHistory) {
    if (sale.status !== "CANCELLED") {
      alert("Transaksi harus dibatalkan dulu sebelum dihapus dari riwayat.");
      return;
    }

    const confirmed = window.confirm(
      `Hapus riwayat penjualan ${sale.transaction_number}?\n\nData yang sudah dihapus tidak bisa dikembalikan.`
    );

    if (!confirmed) return;

    setIsProcessing(sale.id);

    try {
      const { error: deleteDetailsError } = await supabase
        .from("sales_details")
        .delete()
        .eq("sales_id", sale.id);

      if (deleteDetailsError) throw new Error(deleteDetailsError.message);

      const { error: deleteHeaderError } = await supabase
        .from("sales_headers")
        .delete()
        .eq("id", sale.id)
        .eq("status", "CANCELLED");

      if (deleteHeaderError) throw new Error(deleteHeaderError.message);

      alert("Riwayat penjualan berhasil dihapus.");

      await loadSalesHistory();
    } catch (error) {
      alert(
        "Gagal hapus riwayat penjualan: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsProcessing(null);
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Penjualan"
        description="Catat transaksi penjualan, diskon, pajak, dan total transaksi."
        action={
          <Button onClick={handleSaveSales} disabled={isSaving}>
            <Plus size={20} />
            {isSaving ? "Menyimpan..." : "Simpan Penjualan"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
          <label className="text-sm font-semibold">Perusahaan Aktif</label>
          <input
            value={companies.find((item) => item.id === company)?.name || "Belum dipilih"}
            readOnly
            className="mt-2 w-full border rounded-2xl px-4 py-3 bg-slate-100 font-semibold"
          />
          <p className="text-xs text-slate-500 mt-2">
            Ganti perusahaan melalui selector di Header.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
          <label className="text-sm font-semibold">No Transaksi</label>
          <input
            value={transactionNumber}
            readOnly
            className="mt-2 w-full border rounded-2xl px-4 py-3 bg-slate-100"
          />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
          <label className="text-sm font-semibold">Tanggal</label>
          <input
            type="date"
            value={salesDate}
            onChange={(e) => setSalesDate(e.target.value)}
            className="mt-2 w-full border rounded-2xl px-4 py-3"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Informasi Penjualan</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="text-sm font-semibold">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            >
              <option value="">Pilih Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Gudang</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            >
              <option value="">Pilih Gudang</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <InvoiceIdentityFields
          value={invoiceIdentity}
          onChange={setInvoiceIdentity}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Detail Barang</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <select
            value={selectedProduct}
            onChange={(e) => handleProductChange(e.target.value)}
            className="border rounded-2xl px-4 py-3 w-full"
          >
            <option value="">Pilih Produk</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Qty"
            inputMode="decimal"
            className="border rounded-2xl px-4 py-3 w-full"
          />

          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Harga Jual"
            inputMode="decimal"
            className="border rounded-2xl px-4 py-3 w-full"
          />

          <input
            value={`Rp ${subtotalInput.toLocaleString("id-ID")}`}
            readOnly
            className="border rounded-2xl px-4 py-3 bg-slate-100"
          />

          <Button onClick={handleAddItem}>
            <Plus size={18} />
            Tambah
          </Button>
        </div>

        <div className="border rounded-2xl overflow-hidden overflow-x-auto mt-6">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Produk</th>
                <th className="p-4 text-center">Satuan</th>
                <th className="p-4 text-right">Qty</th>
                <th className="p-4 text-right">Harga Jual</th>
                <th className="p-4 text-right">Subtotal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.product_id}-${index}`} className="border-t">
                  <td className="p-4 font-semibold">{item.product_name}</td>
                  <td className="p-4 text-center">{item.unit_name || "-"}</td>
                  <td className="p-4 text-right">
                    {item.qty.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right">
                    Rp {item.price.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right font-semibold">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Belum ada barang ditambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
          <h2 className="text-lg font-bold">Diskon & Pajak</h2>

          <p className="text-sm text-slate-500 mt-1 mb-6">
            Atur diskon dan pajak sebelum transaksi disimpan.
          </p>

          <div className="mb-6">
            <label className="text-sm font-semibold">Jenis Diskon</label>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setDiscountType("nominal")}
                className={`py-3 rounded-2xl border font-semibold ${
                  discountType === "nominal"
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                Rupiah
              </button>

              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`py-3 rounded-2xl border font-semibold ${
                  discountType === "percent"
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                Persen (%)
              </button>
            </div>

            <input
              type="number"
              min="0"
              max={discountType === "percent" ? 100 : undefined}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={
                discountType === "percent" ? "Contoh: 10" : "Contoh: 50000"
              }
              className="mt-3 w-full border rounded-2xl px-4 py-3"
            />

            <p className="text-sm text-slate-500 mt-2">
              Nilai diskon:{" "}
              <strong>
                Rp {Math.round(totalDiskon).toLocaleString("id-ID")}
              </strong>
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold">Pajak</label>

            <select
              value={taxMode}
              onChange={(e) => setTaxMode(e.target.value as TaxMode)}
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            >
              <option value="none">Tanpa Pajak</option>
              <option value="11">PPN 11%</option>
              <option value="custom">Custom</option>
            </select>

            {taxMode === "custom" && (
              <input
                type="number"
                min="0"
                value={customTaxPercent}
                onChange={(e) => setCustomTaxPercent(e.target.value)}
                placeholder="Masukkan persen pajak"
                className="mt-3 w-full border rounded-2xl px-4 py-3"
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
          <h2 className="text-lg font-bold mb-6">Ringkasan Penjualan</h2>

          <div className="space-y-4">
            <div className="flex justify-between gap-4 text-slate-600">
              <span>Subtotal Barang</span>
              <span className="font-semibold">
                Rp {subtotalBarang.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-slate-600">
              <span>
                Diskon
                {discountType === "percent" && nilaiDiskonInput > 0
                  ? ` (${Math.min(nilaiDiskonInput, 100)}%)`
                  : ""}
              </span>
              <span>- Rp {Math.round(totalDiskon).toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between gap-4 border-t pt-4 text-slate-600">
              <span>DPP</span>
              <span className="font-semibold">
                Rp {Math.round(dpp).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-slate-600">
              <span>PPN{persenPajak > 0 ? ` (${persenPajak}%)` : ""}</span>
              <span>Rp {Math.round(totalPajak).toLocaleString("id-ID")}</span>
            </div>

            <div className="bg-slate-950 text-white rounded-2xl p-5 mt-5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                <span className="font-bold">Grand Total</span>
                <span className="text-xl md:text-2xl font-black text-right">
                  Rp {Math.round(grandTotal).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold">Riwayat Penjualan</h2>

        <p className="text-sm text-slate-500 mt-1 mb-6">
          Edit membatalkan transaksi lama dan memuat ulang datanya sebagai draft baru.
        </p>

        <div className="border rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">No Transaksi</th>
                <th className="p-4 text-left">Tanggal</th>
                <th className="p-4 text-left">Perusahaan</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Gudang</th>
                <th className="p-4 text-right">Subtotal</th>
                <th className="p-4 text-right">Diskon</th>
                <th className="p-4 text-right">PPN</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {salesHistory.map((sale) => (
                <tr key={sale.id} className="border-t hover:bg-slate-50">
                  <td className="p-4 font-semibold">
                    {sale.transaction_number}
                  </td>
                  <td className="p-4">{sale.transaction_date}</td>
                  <td className="p-4">{sale.companies?.name || "-"}</td>
                  <td className="p-4">{sale.customers?.name || "-"}</td>
                  <td className="p-4">{sale.warehouses?.name || "-"}</td>
                  <td className="p-4 text-right">
                    Rp{" "}
                    {Number(sale.subtotal_amount || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right">
                    Rp{" "}
                    {Number(sale.discount_amount || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right">
                    Rp {Number(sale.tax_amount || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right font-bold">
                    Rp{" "}
                    {Number(
                      sale.grand_total || sale.total_amount || 0
                    ).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-center">
                    {sale.status === "CANCELLED" ? (
                      <span className="inline-flex px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                        DIBATALKAN
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                        POSTED
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={isProcessing === sale.id}
                        onClick={() => handleEditSales(sale)}
                        className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold disabled:opacity-50"
                      >
                        Edit
                      </button>

                      {sale.status !== "CANCELLED" && (
                        <button
                          type="button"
                          disabled={isProcessing === sale.id}
                          onClick={() =>
                            handleCancelSales(sale.id, sale.transaction_number)
                          }
                          className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold disabled:opacity-50"
                        >
                          <RotateCcw size={16} className="inline mr-1" />
                          Batalkan
                        </button>
                      )}

                      {sale.status === "CANCELLED" && (
                        <button
                          type="button"
                          disabled={isProcessing === sale.id}
                          onClick={() => handleDeleteSales(sale)}
                          className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold disabled:opacity-50"
                        >
                          <Trash2 size={16} className="inline mr-1" />
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {salesHistory.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    Belum ada riwayat penjualan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}