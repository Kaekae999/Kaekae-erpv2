create extension if not exists "pgcrypto";

create table categories (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) unique not null,
  name varchar(100) not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table units (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) unique not null,
  name varchar(100) not null,
  symbol varchar(20),
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table warehouses (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) unique not null,
  name varchar(100) not null,
  address text,
  city varchar(100),
  phone varchar(30),
  pic varchar(100),
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) unique not null,
  name varchar(150) not null,
  address text,
  city varchar(100),
  phone varchar(30),
  email varchar(100),
  npwp varchar(50),
  contact_person varchar(100),
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) unique not null,
  name varchar(150) not null,
  address text,
  city varchar(100),
  phone varchar(30),
  email varchar(100),
  npwp varchar(50),
  contact_person varchar(100),
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  code varchar(30) unique not null,
  name varchar(150) not null,
  category_id uuid references categories(id),
  unit_id uuid references units(id),
  purchase_price numeric(18,2) default 0,
  selling_price numeric(18,2) default 0,
  minimum_stock numeric(18,2) default 0,
  barcode varchar(100),
  photo text,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_categories_updated_at before update on categories for each row execute function set_updated_at();
create trigger trg_units_updated_at before update on units for each row execute function set_updated_at();
create trigger trg_warehouses_updated_at before update on warehouses for each row execute function set_updated_at();
create trigger trg_suppliers_updated_at before update on suppliers for each row execute function set_updated_at();
create trigger trg_customers_updated_at before update on customers for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products for each row execute function set_updated_at();

alter table categories enable row level security;
alter table units enable row level security;
alter table warehouses enable row level security;
alter table suppliers enable row level security;
alter table customers enable row level security;
alter table products enable row level security;

create policy "Allow All Categories" on categories for all using (true) with check (true);
create policy "Allow All Units" on units for all using (true) with check (true);
create policy "Allow All Warehouses" on warehouses for all using (true) with check (true);
create policy "Allow All Suppliers" on suppliers for all using (true) with check (true);
create policy "Allow All Customers" on customers for all using (true) with check (true);
create policy "Allow All Products" on products for all using (true) with check (true);

insert into categories (code, name, description) values
('EMAS', 'Emas', 'Produk emas dan perhiasan'),
('BERAS', 'Beras', 'Produk beras dan hasil pertanian'),
('SUSU', 'Susu', 'Produk susu dan minuman'),
('UMUM', 'Umum', 'Kategori umum');

insert into units (code, name, symbol, description) values
('GR', 'Gram', 'gr', 'Satuan gram'),
('KG', 'Kilogram', 'kg', 'Satuan kilogram'),
('PCS', 'Pieces', 'pcs', 'Satuan item'),
('KARTON', 'Karton', 'karton', 'Satuan karton');

insert into warehouses (code, name, address, city, pic, description) values
('GDG-UTAMA', 'Gudang Utama', 'Alamat gudang utama', 'Semarang', 'Zea', 'Gudang utama'),
('GDG-TOROH', 'Gudang Toroh', 'Toroh', 'Grobogan', 'Tim Operasional', 'Gudang Toroh');

insert into suppliers (code, name, address, city, contact_person, description) values
('SUP-001', 'Supplier Utama', 'Alamat supplier utama', 'Semarang', 'PIC Supplier', 'Supplier contoh'),
('SUP-002', 'CV Maju Jaya', 'Alamat CV Maju Jaya', 'Semarang', 'PIC CV', 'Supplier barang umum');

insert into customers (code, name, address, city, contact_person, description) values
('CUST-001', 'Customer Umum', 'Alamat customer umum', 'Semarang', 'PIC Customer', 'Customer contoh'),
('CUST-002', 'Dapur MBG', 'Alamat Dapur MBG', 'Purwodadi', 'PIC Dapur MBG', 'Customer MBG');

insert into products
(code, name, category_id, unit_id, purchase_price, selling_price, minimum_stock, description)
values
('PRD-EMAS-001', 'Cincin Emas 24K',
 (select id from categories where code = 'EMAS'),
 (select id from units where code = 'GR'),
 17000000, 18500000, 10, 'Produk contoh emas'),

('PRD-BERAS-001', 'Beras Premium',
 (select id from categories where code = 'BERAS'),
 (select id from units where code = 'KG'),
 13400, 14100, 100, 'Produk contoh beras'),

('PRD-SUSU-001', 'Susu UHT',
 (select id from categories where code = 'SUSU'),
 (select id from units where code = 'KARTON'),
 125000, 130500, 20, 'Produk contoh susu');

select 'Master database ready' as status;