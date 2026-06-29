-- Tong Service IT Billing v2 hardening migration
-- Run after schema.sql on an existing Supabase project.

alter table customers add column if not exists is_active boolean not null default true;
alter table customers add column if not exists updated_at timestamptz not null default now();
alter table products add column if not exists is_active boolean not null default true;
alter table products add column if not exists updated_at timestamptz not null default now();
alter table documents add column if not exists customer_snapshot jsonb;
alter table documents add column if not exists shop_snapshot jsonb;
alter table documents add column if not exists cancelled_at timestamptz;
alter table documents add column if not exists cancellation_reason text;
alter table documents add column if not exists updated_at timestamptz not null default now();
alter table shop_settings add column if not exists updated_at timestamptz not null default now();

alter table products drop constraint if exists products_price_non_negative;
alter table products add constraint products_price_non_negative check (price >= 0);
alter table products drop constraint if exists products_stock_non_negative;
alter table products add constraint products_stock_non_negative check (stock_qty >= 0);
alter table document_items drop constraint if exists document_items_qty_positive;
alter table document_items add constraint document_items_qty_positive check (qty > 0);
alter table document_items drop constraint if exists document_items_unit_price_non_negative;
alter table document_items add constraint document_items_unit_price_non_negative check (unit_price >= 0);

create index if not exists idx_customers_is_active on customers(is_active);
create index if not exists idx_products_is_active on products(is_active);
