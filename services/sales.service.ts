import { supabase } from "@/lib/supabase";
import { SaveSalesInput } from "@/types/sales";

export const SalesService = {
  async saveSales(input: SaveSalesInput) {
    if (!input.company_id) {
      throw new Error("Perusahaan aktif belum dipilih.");
    }

    const subtotalBarang = input.items.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0
    );

    const discountAmount = Math.round(Number(input.discount_amount || 0));
    const taxPercent = Number(input.tax_percent || 0);
    const dpp = Math.max(0, subtotalBarang - discountAmount);
    const taxAmount = Math.round(Number(input.tax_amount || 0));
    const grandTotal = Math.round(Number(input.grand_total ?? dpp + taxAmount));

    const detailRows: any[] = [];
    let totalHpp = 0;

    for (const item of input.items) {
      const { data: stock, error: stockError } = await supabase
        .from("product_stocks")
        .select("id, qty, average_cost, stock_value")
        .eq("product_id", item.product_id)
        .eq("warehouse_id", input.warehouse_id)
        .maybeSingle();

      if (stockError) throw new Error(stockError.message);
      if (!stock) throw new Error("Stok produk tidak ditemukan.");

      const currentQty = Number(stock.qty || 0);
      const sellQty = Number(item.qty || 0);

      if (currentQty < sellQty) {
        throw new Error("Stok tidak cukup untuk salah satu produk.");
      }

      const unitCost = Number(stock.average_cost || 0);
      const totalCost = Math.round(sellQty * unitCost);
      const subtotal = Math.round(Number(item.subtotal || 0));
      const grossProfit = subtotal - totalCost;

      totalHpp += totalCost;

      detailRows.push({
        product_id: item.product_id,
        qty: sellQty,
        price: Math.round(Number(item.price || 0)),
        subtotal,
        unit_name: item.unit_name || "-",
        unit_cost: unitCost,
        total_cost: totalCost,
        gross_profit: grossProfit,
        stock_id: stock.id,
        old_qty: currentQty,
        old_stock_value: Number(stock.stock_value || 0),
      });
    }

    totalHpp = Math.round(totalHpp);
    const totalProfit = Math.round(grandTotal - totalHpp);

    const { data: header, error: headerError } = await supabase
      .from("sales_headers")
      .insert({
        company_id: input.company_id,
        transaction_number: input.transaction_number,
        transaction_date: input.transaction_date,
        customer_id: input.customer_id,
        warehouse_id: input.warehouse_id,
        status: "POSTED",
        goods_amount: subtotalBarang,
        subtotal_amount: subtotalBarang,
        discount_amount: discountAmount,
        tax_percent: taxPercent,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        total_amount: grandTotal,
        total_cost: totalHpp,
        gross_profit: totalProfit,
      })
      .select()
      .single();

    if (headerError) throw new Error(headerError.message);

    const insertDetails = detailRows.map((item) => ({
      sales_id: header.id,
      product_id: item.product_id,
      qty: item.qty,
      price: item.price,
      subtotal: item.subtotal,
      unit_name: item.unit_name,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost,
      gross_profit: item.gross_profit,
    }));

    const { error: detailError } = await supabase
      .from("sales_details")
      .insert(insertDetails);

    if (detailError) throw new Error(detailError.message);

    for (const item of detailRows) {
      const newQty = item.old_qty - item.qty;
      const newStockValue =
        newQty === 0
          ? 0
          : Math.max(0, Math.round(item.old_stock_value - item.total_cost));
      const newAverageCost = newQty === 0 ? 0 : newStockValue / newQty;

      const { error: updateError } = await supabase
        .from("product_stocks")
        .update({
          qty: newQty,
          average_cost: newAverageCost,
          stock_value: newStockValue,
        })
        .eq("id", item.stock_id);

      if (updateError) throw new Error(updateError.message);
    }

    return header;
  },

  async cancelSales(salesId: string) {
    const { data: header, error: headerError } = await supabase
      .from("sales_headers")
      .select("id, warehouse_id, status")
      .eq("id", salesId)
      .single();

    if (headerError) throw new Error(headerError.message);
    if (!header) throw new Error("Data penjualan tidak ditemukan.");
    if (header.status === "CANCELLED") {
      throw new Error("Penjualan ini sudah dibatalkan sebelumnya.");
    }

    const { data: details, error: detailError } = await supabase
      .from("sales_details")
      .select("id, product_id, qty, total_cost")
      .eq("sales_id", salesId);

    if (detailError) throw new Error(detailError.message);
    if (!details || details.length === 0) {
      throw new Error("Detail penjualan tidak ditemukan.");
    }

    for (const detail of details) {
      const { data: stock, error: stockError } = await supabase
        .from("product_stocks")
        .select("id, qty, average_cost, stock_value")
        .eq("product_id", detail.product_id)
        .eq("warehouse_id", header.warehouse_id)
        .maybeSingle();

      if (stockError) throw new Error(stockError.message);

      const returnQty = Number(detail.qty || 0);
      const returnValue = Math.round(Number(detail.total_cost || 0));

      if (stock) {
        const oldQty = Number(stock.qty || 0);
        const oldValue =
          Number(stock.stock_value || 0) ||
          oldQty * Number(stock.average_cost || 0);

        const newQty = oldQty + returnQty;
        const newValue = Math.round(oldValue + returnValue);
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
      } else {
        const averageCost = returnQty === 0 ? 0 : returnValue / returnQty;

        const { error: insertError } = await supabase
          .from("product_stocks")
          .insert({
            product_id: detail.product_id,
            warehouse_id: header.warehouse_id,
            qty: returnQty,
            stock_value: returnValue,
            average_cost: averageCost,
          });

        if (insertError) throw new Error(insertError.message);
      }
    }

    const { error: cancelError } = await supabase
      .from("sales_headers")
      .update({ status: "CANCELLED" })
      .eq("id", salesId);

    if (cancelError) throw new Error(cancelError.message);
    return true;
  },
};
