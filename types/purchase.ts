export interface PurchaseItemInput {
  product_id: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface PurchaseCostInput {
  cost_type_id: string;
  amount: number;
  notes?: string;
}

export interface SavePurchaseInput {
  transaction_number: string;
  transaction_date: string;
  supplier_id: string;
  warehouse_id: string;
  items: PurchaseItemInput[];
  costs: PurchaseCostInput[];
}