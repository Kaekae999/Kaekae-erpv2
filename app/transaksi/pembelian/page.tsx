"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { PurchaseService } from "@/services/purchase.service";
import { Plus, RotateCcw, Trash2 } from "lucide-react";

interface Supplier {
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
  purchase_price: number;
  business_type_id: string | null;
}

interface CostType {
  id: string;
  name: string;
  business_type_id: string | null;
}

interface PurchaseItem {
  product_id: string;
  product_name: string;
  qty: number;
  price: number;
  subtotal: number;
}

interface CostItem {
  cost_type_id: string;
  cost_type_name: string;
  amount: number;
  notes: string;
}

interface PurchaseHistory {
  id: string;
  transaction_number: string;
  transaction_date: string;
  supplier_id: string;
  warehouse_id: string;
  company_id: string;
  goods_amount: number;
  operational_cost: number;
  grand_total: number;
  status: string;
  suppliers: { name: string } | null;
  warehouses: { name: string } | null;
  companies: { name: string } | null;
}

function generateTransactionNumber() {
  return `PB-${new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "")}-${String(Date.now()).slice(-4)}`;
}

export default function PembelianPage() {
  const { workspace, company, companies } = useWorkspace();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [costTypes, setCostTypes] = useState<CostType[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);

  const [transactionNumber, setTransactionNumber] = useState(generateTransactionNumber());
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const [selectedCostType, setSelectedCostType] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costNotes, setCostNotes] = useState("");
  const [costs, setCosts] = useState<CostItem[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadMasterData();
    loadPurchaseHistory();
  }, [workspace]);

  async function loadMasterData() {
    const supplierResult = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    const warehouseResult = await supabase
      .from("warehouses")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    let productQuery = supabase
      .from("products")
      .select("id, name, purchase_price, business_type_id")
      .eq("is_active", true)
      .order("name");

    if (workspace !== "all") {
      productQuery = productQuery.eq("business_type_id", workspace);
    }

    const costResult = await supabase
      .from("cost_types")
      .select("id, name, business_type_id")
      .eq("is_active", true)
      .order("name");

    const productResult = await productQuery;

    const filteredCostTypes =
      workspace === "all"
        ? costResult.data || []
        : (costResult.data || []).filter(
            (item) =>
              item.business_type_id === null ||
              item.business_type_id === workspace
          );

    if (supplierResult.data) setSuppliers(supplierResult.data);
    if (warehouseResult.data) setWarehouses(warehouseResult.data);
    if (productResult.data) setProducts(productResult.data);
    setCostTypes(filteredCostTypes);
  }

  async function loadPurchaseHistory() {
    const { data, error } = await supabase
      .from("purchase_headers")
      .select(`
        id,
        transaction_number,
        transaction_date,
        supplier_id,
        warehouse_id,
        company_id,
        goods_amount,
        operational_cost,
        grand_total,
        status,
        suppliers(name),
        warehouses(name),
        companies(name)
      `)
      .order("transaction_date", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Gagal mengambil riwayat pembelian:", error.message);
      return;
    }

    setPurchaseHistory((data || []) as any);
  }

  function resetForm() {
    setTransactionNumber(generateTransactionNumber());
    setSupplierId("");
    setWarehouseId("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setItems([]);
    setCosts([]);
    setSelectedProduct("");
    setQty("");
    setPrice("");
    setSelectedCostType("");
    setCostAmount("");
    setCostNotes("");
  }

  function handleProductChange(productId: string) {
    setSelectedProduct(productId);

    const product = products.find((item) => item.id === productId);
    if (product) setPrice(String(product.purchase_price));
  }

  function handleAddItem() {
    const product = products.find((item) => item.id === selectedProduct);
    if (!product) return alert("Pilih produk dulu.");

    const qtyNumber = Number(qty);
    const priceNumber = Number(price);

    if (qtyNumber <= 0 || priceNumber <= 0) {
      return alert("Qty dan harga harus lebih dari 0.");
    }

    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        qty: qtyNumber,
        price: priceNumber,
        subtotal: qtyNumber * priceNumber,
      },
    ]);

    setSelectedProduct("");
    setQty("");
    setPrice("");
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleAddCost() {
    const costType = costTypes.find((item) => item.id === selectedCostType);
    const amountNumber = Number(costAmount);

    if (!costType) return alert("Pilih jenis biaya dulu.");
    if (amountNumber <= 0) return alert("Nominal biaya harus lebih dari 0.");

    setCosts((prev) => [
      ...prev,
      {
        cost_type_id: costType.id,
        cost_type_name: costType.name,
        amount: amountNumber,
        notes: costNotes,
      },
    ]);

    setSelectedCostType("");
    setCostAmount("");
    setCostNotes("");
  }

  function handleRemoveCost(index: number) {
    setCosts((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSavePurchase() {
    if (!company) return alert("Perusahaan aktif wajib dipilih.");
    if (!purchaseDate) return alert("Tanggal pembelian wajib diisi.");
    if (!supplierId) return alert("Supplier wajib dipilih.");
    if (!warehouseId) return alert("Gudang wajib dipilih.");
    if (items.length === 0) return alert("Detail barang masih kosong.");

    setIsSaving(true);

    try {
      await PurchaseService.savePurchase({
        company_id: company,
        transaction_number: transactionNumber,
        transaction_date: purchaseDate,
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        items: items.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal,
        })),
        costs: costs.map((cost) => ({
          cost_type_id: cost.cost_type_id,
          amount: cost.amount,
          notes: cost.notes,
        })),
      });

      alert("Pembelian berhasil disimpan, biaya pembelian tercatat, dan stok terupdate.");

      resetForm();
      await loadPurchaseHistory();
    } catch (error) {
      alert(
        "Gagal simpan pembelian: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancelPurchase(
    purchaseId: string,
    transactionNumberText: string
  ) {
    const confirmed = window.confirm(
      `Batalkan pembelian ${transactionNumberText}?\n\nStok dari transaksi ini akan dikembalikan.`
    );

    if (!confirmed) return;

    setIsProcessing(purchaseId);

    try {
      await PurchaseService.cancelPurchase(purchaseId);

      alert(
        `Pembelian ${transactionNumberText} berhasil dibatalkan dan stok telah dikembalikan.`
      );

      await loadPurchaseHistory();
    } catch (error) {
      alert(
        "Gagal membatalkan pembelian: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleEditPurchase(purchase: PurchaseHistory) {
    const confirmed = window.confirm(
      purchase.status === "CANCELLED"
        ? `Gunakan data ${purchase.transaction_number} sebagai draft baru?`
        : `Edit pembelian ${purchase.transaction_number}?\n\nTransaksi lama akan dibatalkan dulu, stok dikembalikan, lalu datanya dimasukkan ke form untuk disimpan ulang.`
    );

    if (!confirmed) return;

    setIsProcessing(purchase.id);

    try {
      const { data: details, error: detailError } = await supabase
        .from("purchase_details")
        .select(`
          id,
          product_id,
          qty,
          price,
          subtotal,
          products(name)
        `)
        .eq("purchase_id", purchase.id);

      if (detailError) throw new Error(detailError.message);

      let groupedCosts: CostItem[] = [];
      const detailIds = (details || []).map((detail: any) => detail.id);

      if (detailIds.length > 0) {
        const { data: costData, error: costError } = await supabase
          .from("purchase_costs")
          .select(`
            cost_type_id,
            amount,
            notes,
            cost_types(name)
          `)
          .in("purchase_detail_id", detailIds);

        if (costError) {
          console.warn("Biaya tidak ikut dimuat:", costError.message);
        }

        const map = new Map<string, CostItem>();

        (costData || []).forEach((cost: any) => {
          const key = cost.cost_type_id;
          const existing = map.get(key);

          if (existing) {
            existing.amount += Number(cost.amount || 0);
          } else {
            map.set(key, {
              cost_type_id: cost.cost_type_id,
              cost_type_name: cost.cost_types?.name || "Biaya",
              amount: Number(cost.amount || 0),
              notes: cost.notes || "",
            });
          }
        });

        groupedCosts = Array.from(map.values());
      }

      if (purchase.status !== "CANCELLED") {
        await PurchaseService.cancelPurchase(purchase.id);
      }

      setTransactionNumber(generateTransactionNumber());
      setPurchaseDate(purchase.transaction_date);
      setSupplierId(purchase.supplier_id || "");
      setWarehouseId(purchase.warehouse_id || "");

      setItems(
        ((details || []) as any[]).map((detail) => ({
          product_id: detail.product_id,
          product_name: detail.products?.name || "-",
          qty: Number(detail.qty || 0),
          price: Number(detail.price || 0),
          subtotal: Number(detail.subtotal || 0),
        }))
      );

      setCosts(groupedCosts);

      alert(
        "Data pembelian sudah masuk ke form. Silakan adjust, lalu klik Simpan Pembelian."
      );

      await loadPurchaseHistory();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      alert(
        "Gagal memuat data pembelian: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleDeletePurchase(purchase: PurchaseHistory) {
    if (purchase.status !== "CANCELLED") {
      alert("Transaksi harus dibatalkan dulu sebelum dihapus dari riwayat.");
      return;
    }

    const confirmed = window.confirm(
      `Hapus riwayat pembelian ${purchase.transaction_number}?\n\nData yang sudah dihapus tidak bisa dikembalikan.`
    );

    if (!confirmed) return;

    setIsProcessing(purchase.id);

    try {
      const { data: details, error: detailError } = await supabase
        .from("purchase_details")
        .select("id")
        .eq("purchase_id", purchase.id);

      if (detailError) throw new Error(detailError.message);

      const detailIds = (details || []).map((item) => item.id);

      if (detailIds.length > 0) {
        const { error: deleteCostsError } = await supabase
          .from("purchase_costs")
          .delete()
          .in("purchase_detail_id", detailIds);

        if (deleteCostsError) throw new Error(deleteCostsError.message);
      }

      const { error: deleteDetailsError } = await supabase
        .from("purchase_details")
        .delete()
        .eq("purchase_id", purchase.id);

      if (deleteDetailsError) throw new Error(deleteDetailsError.message);

      const { error: deleteHeaderError } = await supabase
        .from("purchase_headers")
        .delete()
        .eq("id", purchase.id)
        .eq("status", "CANCELLED");

      if (deleteHeaderError) throw new Error(deleteHeaderError.message);

      alert("Riwayat pembelian berhasil dihapus.");

      await loadPurchaseHistory();
    } catch (error) {
      alert(
        "Gagal hapus riwayat pembelian: " +
          (error instanceof Error ? error.message : "Error tidak diketahui")
      );
    } finally {
      setIsProcessing(null);
    }
  }

  const subtotal = Number(qty || 0) * Number(price || 0);
  const totalBarang = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalBiaya = costs.reduce((sum, item) => sum + item.amount, 0);
  const totalModal = totalBarang + totalBiaya;

  return (
    <Layout>
      <PageHeader
        title="Pembelian"
        description="Catat pembelian barang, biaya pembelian, dan otomatis menambah stok."
        action={
          <Button onClick={handleSavePurchase} disabled={isSaving}>
            <Plus size={20} />
            {isSaving ? "Menyimpan..." : "Simpan Pembelian"}
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
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="mt-2 w-full border rounded-2xl px-4 py-3"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Informasi Pembelian</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="text-sm font-semibold">Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            >
              <option value="">Pilih Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
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

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Detail Barang</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-4">
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
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Qty"
            inputMode="decimal"
            className="border rounded-2xl px-4 py-3 w-full"
          />

          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Harga"
            inputMode="decimal"
            className="border rounded-2xl px-4 py-3 w-full"
          />

          <input
            value={`Rp ${subtotal.toLocaleString("id-ID")}`}
            readOnly
            className="border rounded-2xl px-4 py-3 bg-slate-100"
          />

          <div className="w-full">
            <Button onClick={handleAddItem}>
              <Plus size={18} />
              Tambah
            </Button>
          </div>
        </div>

        <div className="border rounded-2xl overflow-hidden overflow-x-auto mt-6">
          <table className="w-full min-w-[720px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Produk</th>
                <th className="p-4 text-right">Qty</th>
                <th className="p-4 text-right">Harga</th>
                <th className="p-4 text-right">Subtotal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.product_id}-${index}`} className="border-t">
                  <td className="p-4">{item.product_name}</td>
                  <td className="p-4 text-right">
                    {item.qty.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right">
                    Rp {item.price.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-right">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-center">
                    <button
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
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Belum ada barang ditambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Biaya Pembelian</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
          <select
            value={selectedCostType}
            onChange={(e) => setSelectedCostType(e.target.value)}
            className="border rounded-2xl px-4 py-3 w-full"
          >
            <option value="">Pilih Jenis Biaya</option>
            {costTypes.map((cost) => (
              <option key={cost.id} value={cost.id}>
                {cost.name}
              </option>
            ))}
          </select>

          <input
            value={costAmount}
            onChange={(e) => setCostAmount(e.target.value)}
            placeholder="Nominal"
            inputMode="decimal"
            className="border rounded-2xl px-4 py-3 w-full"
          />

          <input
            value={costNotes}
            onChange={(e) => setCostNotes(e.target.value)}
            placeholder="Catatan"
            className="border rounded-2xl px-4 py-3 w-full"
          />

          <div className="w-full">
            <Button onClick={handleAddCost}>
              <Plus size={18} />
              Tambah Biaya
            </Button>
          </div>
        </div>

        <div className="border rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Jenis Biaya</th>
                <th className="p-4 text-left">Catatan</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {costs.map((cost, index) => (
                <tr key={`${cost.cost_type_id}-${index}`} className="border-t">
                  <td className="p-4">{cost.cost_type_name}</td>
                  <td className="p-4">{cost.notes || "-"}</td>
                  <td className="p-4 text-right">
                    Rp {cost.amount.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleRemoveCost(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {costs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    Belum ada biaya pembelian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-6">
        <div className="flex justify-end">
          <div className="w-full max-w-md space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Total Barang</span>
              <span>Rp {totalBarang.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Biaya Pembelian</span>
              <span>Rp {totalBiaya.toLocaleString("id-ID")}</span>
            </div>

            <div className="border-t pt-3 flex justify-between">
              <span className="text-slate-500">Total Modal</span>
              <span className="text-xl md:text-3xl font-bold text-right">
                Rp {totalModal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6">
        <h2 className="text-xl font-bold">Riwayat Pembelian</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Edit membatalkan transaksi lama dan memuat ulang datanya sebagai draft
          baru.
        </p>

        <div className="border rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">No Transaksi</th>
                <th className="p-4 text-left">Tanggal</th>
                <th className="p-4 text-left">Perusahaan</th>
                <th className="p-4 text-left">Supplier</th>
                <th className="p-4 text-left">Gudang</th>
                <th className="p-4 text-right">Barang</th>
                <th className="p-4 text-right">Biaya Pembelian</th>
                <th className="p-4 text-right">Total Modal</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {purchaseHistory.map((purchase) => (
                <tr key={purchase.id} className="border-t hover:bg-slate-50">
                  <td className="p-4 font-semibold">
                    {purchase.transaction_number}
                  </td>
                  <td className="p-4">{purchase.transaction_date}</td>
                  <td className="p-4">{purchase.companies?.name || "-"}</td>
                  <td className="p-4">{purchase.suppliers?.name || "-"}</td>
                  <td className="p-4">{purchase.warehouses?.name || "-"}</td>
                  <td className="p-4 text-right">
                    Rp{" "}
                    {Number(purchase.goods_amount || 0).toLocaleString(
                      "id-ID"
                    )}
                  </td>
                  <td className="p-4 text-right">
                    Rp{" "}
                    {Number(purchase.operational_cost || 0).toLocaleString(
                      "id-ID"
                    )}
                  </td>
                  <td className="p-4 text-right font-bold">
                    Rp{" "}
                    {Number(purchase.grand_total || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-center">
                    {purchase.status === "CANCELLED" ? (
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
                        disabled={isProcessing === purchase.id}
                        onClick={() => handleEditPurchase(purchase)}
                        className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold disabled:opacity-50"
                      >
                        Edit
                      </button>

                      {purchase.status !== "CANCELLED" && (
                        <button
                          type="button"
                          disabled={isProcessing === purchase.id}
                          onClick={() =>
                            handleCancelPurchase(
                              purchase.id,
                              purchase.transaction_number
                            )
                          }
                          className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold disabled:opacity-50"
                        >
                          <RotateCcw size={16} className="inline mr-1" />
                          Batalkan
                        </button>
                      )}

                      {purchase.status === "CANCELLED" && (
                        <button
                          type="button"
                          disabled={isProcessing === purchase.id}
                          onClick={() => handleDeletePurchase(purchase)}
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

              {purchaseHistory.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Belum ada riwayat pembelian.
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