create extension if not exists "pgcrypto";

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  customer_type text not null check (customer_type in ('general', 'private', 'government')),
  phone text,
  email text,
  address text,
  tax_id text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  unit text default 'รายการ',
  price numeric(12,2) not null default 0,
  stock_qty numeric(12,2) default 0 check (stock_qty >= 0),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint products_price_non_negative check (price >= 0)
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('QT', 'IN', 'BN', 'RC', 'DO')),
  doc_no text unique not null,
  doc_date date not null,
  due_date date,
  customer_id uuid references customers(id),
  customer_type text not null check (customer_type in ('general', 'private', 'government')),
  source_doc_ids uuid[] default '{}',
  source_doc_nos text[] default '{}',
  subtotal numeric(12,2) default 0,
  withholding_tax numeric(12,2) default 0,
  transfer_fee numeric(12,2) default 0,
  net_total numeric(12,2) default 0,
  note text,
  status text not null,
  customer_snapshot jsonb,
  shop_snapshot jsonb,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  product_id uuid references products(id),
  description text not null,
  qty numeric(12,2) not null default 1 check (qty > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  total numeric(12,2) not null default 0
);

create table if not exists document_counters (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null,
  year_month text not null,
  last_number int not null default 0,
  unique(doc_type, year_month)
);

create table if not exists shop_settings (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null,
  address text,
  phone text,
  email text,
  tax_id text,
  scb_account text,
  ktb_account text,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function next_document_no(p_doc_type text, p_year_month text)
returns text
language plpgsql
as $$
declare
  next_no int;
begin
  insert into document_counters (doc_type, year_month, last_number)
  values (p_doc_type, p_year_month, 1)
  on conflict (doc_type, year_month)
  do update set last_number = document_counters.last_number + 1
  returning last_number into next_no;

  return p_doc_type || lpad(next_no::text, 3, '0') || '-' || p_year_month;
end;
$$;

create index if not exists idx_customers_is_active on customers(is_active);
create index if not exists idx_products_is_active on products(is_active);
create index if not exists idx_documents_doc_type on documents(doc_type);
create index if not exists idx_documents_doc_date on documents(doc_date);
create index if not exists idx_documents_customer_id on documents(customer_id);
create index if not exists idx_documents_status on documents(status);
create index if not exists idx_document_items_document_id on document_items(document_id);

-- RLS starter:
-- This project uses backend service role key on Render.
-- If you later add multi-user auth, enable RLS and create policies per user/store.
