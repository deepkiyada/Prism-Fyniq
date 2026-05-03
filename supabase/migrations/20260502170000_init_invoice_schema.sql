create extension if not exists "pgcrypto";

create table if not exists company_settings (
  id bigint primary key default 1,
  company_name text not null,
  company_email text,
  company_address text,
  tax_id text,
  invoice_prefix text not null default 'INV',
  invoice_next_number bigint not null default 1,
  default_payment_terms_days int not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into company_settings (id, company_name, invoice_prefix, invoice_next_number, default_payment_terms_days)
values (1, 'My Startup', 'INV', 1, 15)
on conflict (id) do nothing;

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  billing_address text,
  notes text,
  currency text not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  cadence text not null default 'monthly',
  anchor_day int not null default 1 check (anchor_day between 1 and 28),
  default_discount_amount numeric(12,2) not null default 0,
  default_discount_note text,
  default_payment_terms_days int not null default 15,
  currency text not null default 'USD',
  start_date date not null,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists schedule_line_items (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references recurring_schedules(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  schedule_id uuid references recurring_schedules(id) on delete set null,
  invoice_number text not null unique,
  status text not null default 'draft',
  issue_date date not null,
  due_date date not null,
  service_period_start date not null,
  service_period_end date not null,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  discount_note text,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'USD',
  pdf_path text,
  docx_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_status_idx on invoices(status);
create index if not exists invoices_period_idx on invoices(service_period_start, service_period_end);
create index if not exists invoices_schedule_idx on invoices(schedule_id, service_period_start);

create table if not exists invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_discount_amount numeric(12,2) not null default 0,
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  method text,
  note text,
  paid_at date not null default current_date,
  created_at timestamptz not null default now()
);
