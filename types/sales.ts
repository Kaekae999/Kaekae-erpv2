export interface SalesItemInput {
  product_id: string;
  qty: number;
  price: number;
  subtotal: number;
  unit_name?: string;
}

export interface SaveSalesInput {
  company_id: string;

  // Identitas pada dokumen invoice. Boleh berbeda dari company_id.
  invoice_company_id: string;
  bank_account_id?: string | null;

  transaction_number: string;
  transaction_date: string;
  due_date?: string | null;

  customer_id: string;
  warehouse_id: string;
  items: SalesItemInput[];

  invoice_notes?: string | null;
  terms_conditions?: string | null;

  discount_amount?: number;
  tax_percent?: number;
  tax_amount?: number;
  grand_total?: number;
}