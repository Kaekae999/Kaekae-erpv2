import { supabase } from "@/lib/supabase";
import { SavePurchaseInput } from "@/types/purchase";

export const PurchaseService = {
  async savePurchase(input: SavePurchaseInput) {
    const totalBarang = input.items.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0
    );

    const totalBiaya = input.costs.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalModal = totalBarang + totalBiaya;

    const { data: header, error: headerError } = await supabase
      .from("purchase_headers")
      .insert({
        transaction_number: input.transaction_number,
        transaction_date: input.transaction_date,
        supplier_id: input.supplier_id,
        warehouse_id: input.warehouse_id,
        status: "POSTED",
        goods_amount: totalBarang,
        operational_cost: totalBiaya,
        grand_total: totalModal,
        total_amount: totalModal,
      })
      .select()
      .single();

    if (headerError) throw new Error(headerError.message);

    const detailRows = input.items.map((item) => {
      const proportion = totalBarang === 0 ? 0 : item.subtotal / totalBarang;
      const allocatedCost = totalBiaya * proportion;
      const totalCost = item.subtotal + allocatedCost;

      return {
        purchase_id: header.id,
        product_id: item.product_id,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
        operational_cost: allocatedCost,
        total_cost: totalCost,
        unit_cost: item.qty === 0 ? 0 : totalCost / item.qty,
      };
    });

    const { data: details, error: detailError } = await supabase
      .from("purchase_details")
      .insert(detailRows)
      .select("id, product_id, qty, subtotal, total_cost");

    if (detailError) throw new Error(detailError.message);

    if (input.costs.length > 0 && details) {
      const costRows: any[] = [];

      input.costs.forEach((cost) => {
        details.forEach((detail) => {
          const proportion =
            totalBarang === 0 ? 0 : Number(detail.subtotal || 0) / totalBarang;

          costRows.push({
            purchase_detail_id: detail.id,
            cost_type_id: cost.cost_type_id,
            amount: Number(cost.amount || 0) * proportion,
            notes: cost.notes || null,
          });
        });
      });

      const { error: costError } = await supabase
        .from("purchase_costs")
        .insert(costRows);

      if (costError) throw new Error(costError.message);
    }

    if (details) {
      for (const item of details) {
        const { data: stock, error: stockError } = await supabase
          .from("product_stocks")
          .select("id, qty, average_cost, stock_value")
          .eq("product_id", item.product_id)
          .eq("warehouse_id", input.warehouse_id)
          .maybeSingle();

        if (stockError) throw new Error(stockError.message);

        const buyQty = Number(item.qty || 0);
        const buyValue = Number(item.total_cost || 0);

        if (stock) {
          const oldQty = Number(stock.qty || 0);
          const oldValue =
            Number(stock.stock_value || 0) ||
            oldQty * Number(stock.average_cost || 0);

          const newQty = oldQty + buyQty;
          const newValue = oldValue + buyValue;
          const newAverageCost = newQty === 0 ? 0 : newValue / newQty;

          const { error: updateStockError } = await supabase
            .from("product_stocks")
            .update({
              qty: newQty,
              average_cost: newAverageCost,
              stock_value: newValue,
            })
            .eq("id", stock.id);

          if (updateStockError) throw new Error(updateStockError.message);
        } else {
          const averageCost = buyQty === 0 ? 0 : buyValue / buyQty;

          const { error: insertStockError } = await supabase
            .from("product_stocks")
            .insert({
              product_id: item.product_id,
              warehouse_id: input.warehouse_id,
              qty: buyQty,
              average_cost: averageCost,
              stock_value: buyValue,
            });

          if (insertStockError) throw new Error(insertStockError.message);
        }
      }
    }

    return header;
  },

  async cancelPurchase(purchaseId: string) {
    const { data: header, error: headerError } = await supabase
      .from("purchase_headers")
      .select("id, warehouse_id, status")
      .eq("id", purchaseId)
      .single();

    if (headerError) throw new Error(headerError.message);
    if (!header) throw new Error("Data pembelian tidak ditemukan.");

    if (header.status === "CANCELLED") {
      throw new Error("Pembelian ini sudah dibatalkan sebelumnya.");
    }

    const { data: details, error: detailError } = await supabase
      .from("purchase_details")
      .select("id, product_id, qty, total_cost")
      .eq("purchase_id", purchaseId);

    if (detailError) throw new Error(detailError.message);
    if (!details || details.length === 0) {
      throw new Error("Detail pembelian tidak ditemukan.");
    }

    for (const detail of details) {
      const { data: stock, error: stockError } = await supabase
        .from("product_stocks")
        .select("id, qty, average_cost, stock_value")
        .eq("product_id", detail.product_id)
        .eq("warehouse_id", header.warehouse_id)
        .maybeSingle();

      if (stockError) throw new Error(stockError.message);
      if (!stock) throw new Error("Stok produk tidak ditemukan.");

      const currentQty = Number(stock.qty || 0);
      const cancelQty = Number(detail.qty || 0);

      if (currentQty < cancelQty) {
        throw new Error(
          "Pembelian tidak bisa dibatalkan karena stok saat ini lebih kecil dari qty pembelian. Kemungkinan barang sudah terjual."
        );
      }
    }

    for (const detail of details) {
      const { data: stock, error: stockError } = await supabase
        .from("product_stocks")
        .select("id, qty, average_cost, stock_value")
        .eq("product_id", detail.product_id)
        .eq("warehouse_id", header.warehouse_id)
        .maybeSingle();

      if (stockError) throw new Error(stockError.message);
      if (!stock) throw new Error("Stok produk tidak ditemukan.");

      const currentQty = Number(stock.qty || 0);
      const currentValue =
        Number(stock.stock_value || 0) ||
        currentQty * Number(stock.average_cost || 0);

      const cancelQty = Number(detail.qty || 0);
      const cancelValue = Number(detail.total_cost || 0);

      const newQty = currentQty - cancelQty;
      const newValue = Math.max(0, currentValue - cancelValue);
      const newAverageCost = newQty === 0 ? 0 : newValue / newQty;

      const { error: updateError } = await supabase
        .from("product_stocks")
        .update({
          qty: newQty,
          stock_value: newValue,
          average_cost: newAverageCost,
        })
        .eq("id", stock.id);

      if (updateError) throw new Error(updateError.message);
    }

    const { error: cancelError } = await supabase
      .from("purchase_headers")
      .update({
        status: "CANCELLED",
      })
      .eq("id", purchaseId);

    if (cancelError) throw new Error(cancelError.message);

    return true;
  },
};