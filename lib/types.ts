export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "pending_payment",
  "partially_paid",
  "paid",
  "void",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type AppUserRole = "super_admin" | "user";

export type AppUser = {
  user_id: string;
  email: string;
  role: AppUserRole;
  created_at?: string;
  updated_at?: string;
};

export type CompanySettings = {
  id: number;
  company_name: string;
  company_email: string | null;
  company_address: string | null;
  tax_id: string | null;
  invoice_prefix: string;
  invoice_next_number: number;
  default_payment_terms_days: number;
  created_at?: string;
  updated_at?: string;
};

export type Client = {
  id: string;
  name: string;
  email: string | null;
  billing_address: string | null;
  notes: string | null;
  currency: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type RecurringSchedule = {
  id: string;
  client_id: string;
  title: string;
  cadence: "monthly";
  anchor_day: number;
  default_discount_amount: number;
  default_discount_note: string | null;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Invoice = {
  id: string;
  client_id: string;
  schedule_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  service_period_start: string;
  service_period_end: string;
  subtotal: number;
  discount_amount: number;
  discount_note: string | null;
  tax_amount: number;
  total: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
};

export type InvoiceLineItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_discount_amount: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  method: string | null;
  note: string | null;
  paid_at: string;
  created_at?: string;
};

export type InvoiceWithDetails = Invoice & {
  client: Client;
  line_items: InvoiceLineItem[];
  payments: Payment[];
};
