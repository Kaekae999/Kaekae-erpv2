create table if not exists purchase_headers (
  id uuid primary key default gen_random_uuid(),
  transaction_number varchar(50) unique not null,
  transaction_date date not null,
  supplier_id uuid references suppliers(id),
  warehouse_id uuid references warehouses(id),
  notes text,
  status varchar(20) default 'DRAFT',
  total_amount numeric(18,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists purchase_details (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid references purchase_headers(id) on delete cascade,
  product_id uuid references products(id),
  qty numeric(18,2) not null,
  price numeric(18,2) not null,
  subtotal numeric(18,2) not null,
  created_at timestamptz default now()
);

alter table purchase_headers enable row level security;
alter table purchase_details enable row level security;

drop policy if exists "Allow All Purchase Headers" on purchase_headers;
create policy "Allow All Purchase Headers" on purchase_headers
for all using (true) with check (true);

drop policy if exists "Allow All Purchase Details" on purchase_details;
create policy "Allow All Purchase Details" on purchase_details
for all using (true) with check (true);

drop trigger if exists trg_purchase_headers_updated_at on purchase_headers;

create trigger trg_purchase_headers_updated_at
before update on purchase_headers
for each row
execute function set_updated_at();

select 'Transaction database ready' as status;
create table if not exists product_stocks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  warehouse_id uuid references warehouses(id),
  qty numeric(18,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(product_id, warehouse_id)
);

alter table product_stocks enable row level security;

drop policy if exists "Allow All Product Stocks" on product_stocks;
create policy "Allow All Product Stocks" on product_stocks
for all using (true) with check (true);

drop trigger if exists trg_product_stocks_updated_at on product_stocks;

create trigger trg_product_stocks_updated_at
before update on product_stocks
for each row
execute function set_updated_at();

select 'Stock database ready' as status;