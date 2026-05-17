alter table invoices
  add column if not exists month_closed boolean not null default false;

create index if not exists invoices_month_closed_idx on invoices(month_closed);
