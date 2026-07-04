export interface SalesItemInput {
  product_id: string;
  qty: number;
  price: number;
  subtotal: number;
  unit_name?: string;
}

export interface SaveSalesInput {
  transaction_number: string;
  transaction_date: string;
  customer_id: string;
  warehouse_id: string;
  items: SalesItemInput[];

  discount_amount?: number;
  tax_percent?: number;
  tax_amount?: number;
  grand_total?: number;
}