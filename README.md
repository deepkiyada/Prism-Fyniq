# Prism Fyniq Invoice Management

Prism Fyniq Invoice Management is a secure internal web application to manage client billing operations end-to-end:
- client records
- invoice creation and status tracking
- payment recording
- recurring schedule generation
- export workflows (PDF/DOCX)

It is built with Next.js + Supabase and is designed to be understandable by both business users and engineers.

---

## 1) Product Summary (Non-Technical)

### What this app does
This application helps a team run invoice operations in one place. Instead of manually maintaining multiple spreadsheets and templates, teams can:
- create and maintain clients
- issue invoices with line items and discount logic
- record incoming payments
- track invoice lifecycle (draft, sent, paid, etc.)
- generate recurring invoices monthly
- export professional invoice documents

### Why this app exists
- Reduce billing mistakes.
- Improve visibility into what is pending vs paid.
- Speed up finance operations for service businesses.
- Create a stable operational system that can scale.

### Who should use it
- Founders and finance operators
- operations managers
- accountants/bookkeepers (internal)

---

## 2) Key Features

- Authentication with Supabase Auth (email/password, verification-capable flow).
- Protected application routes: unauthenticated users are redirected to login.
- Client management.
- Invoice management with line items, totals, discounts.
- Payment logging and status recalculation.
- Recurring schedules for monthly invoice generation.
- Invoice exports via API endpoints (PDF/DOCX).
- Modern shadcn-based UI with responsive app navigation.

---

## 3) High-Level Architecture

### Frontend
- Next.js App Router (`app/`)
- React server + client components
- shadcn/ui components for design system consistency

### Backend / Data
- Supabase (Postgres + Auth)
- Server actions (`app/actions.ts`) for core CRUD operations
- API routes (`app/api/**`) for exports/status/cron jobs

### Auth and Session
- Supabase Auth for signup/signin/signout
- Route protection in `proxy.ts` and `lib/supabase/middleware.ts`
- Auth pages under `app/auth/**`

---

## 4) Tech Stack

- Next.js 16
- React 19
- TypeScript
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- shadcn/ui + Tailwind CSS
- Zod (validation)
- date-fns
- `@react-pdf/renderer` + `docx` for exports

---

## 5) Project Structure

```txt
app/
  auth/                 # login/signup/logout/callback flows
  api/                  # export/status/cron endpoints
  actions.ts            # server actions for business operations
  clients|invoices|...  # feature pages
components/
  ui/                   # shadcn UI primitives
  app-nav.tsx           # authenticated app navigation
lib/
  data.ts               # business/data helpers
  types.ts              # shared domain types
  supabase/             # supabase clients + middleware helpers
supabase/
  migrations/           # database schema SQL
proxy.ts                # app-wide request protection entry
```

---

## 6) Authentication and Access Control

### Current behavior
- If user is not authenticated, any protected route redirects to `/auth/login`.
- Header/nav is hidden for unauthenticated users.
- Login and signup pages are available publicly.
- Logout clears auth session and redirects to login.

### Important Supabase setting
In Supabase dashboard, configure Auth according to your policy:
- for strict email verification: enable email confirmation.
- set site URL / redirect URLs to include your app domain and `/auth/callback`.

---

## 7) Environment Variables

Create `.env.local` in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=
```

### Variable purpose
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: public anon/publishable key for client + SSR auth flows.
- `SUPABASE_SERVICE_ROLE_KEY`: privileged server key (keep secret; never expose to browser).
- `NEXT_PUBLIC_SITE_URL`: canonical app URL for auth callback links.
- `CRON_SECRET`: secret token for cron endpoint authorization.

---

## 8) Local Development Setup (Technical)

### Prerequisites
- Node.js 20+ (recommended)
- npm (project currently includes `package-lock.json`)
- Supabase project with applied schema

### Install and run
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Quality checks
```bash
npm run lint
npm run build
```

---

## 9) Database / Schema

Schema is maintained via SQL migration files:
- `supabase/migrations/20260502170000_init_invoice_schema.sql`

Core domain tables include:
- clients
- invoices
- invoice_line_items
- payments
- recurring_schedules
- schedule_line_items

Use Supabase SQL editor or CLI migrations to apply schema to your environment.

---

## 10) Business Workflow

1. Create client profile.
2. Create invoice (line items + dates + discounts).
3. Mark/track status through lifecycle.
4. Record payment events against invoice.
5. System derives current payment-based status.
6. Generate recurring invoices each month for active schedules.
7. Export invoices for external sharing/accounting.

---

## 11) Security Notes

- Authentication is enforced at middleware level.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Restrict cron endpoint with `CRON_SECRET`.
- For production hardening, consider:
  - strict RLS policies per tenant/user
  - audit logging
  - rate limiting on auth and API routes

---

## 12) Deployment

Can be deployed on Vercel (recommended) or any Next.js-compatible runtime.

Before production:
- set all environment variables
- configure Supabase auth redirect URLs
- verify cron secret
- run `npm run build`

---

## 13) LLM Context Pack (Machine-Readable Summary)

Use this section when giving the project context to an LLM:

```yaml
project_name: Prism Fyniq Invoice Management
project_type: Internal SaaS-style billing operations app
frontend:
  framework: Next.js App Router
  language: TypeScript
  ui: shadcn + Tailwind
backend:
  primary_data_service: Supabase Postgres
  auth: Supabase Auth (email/password, callback-based verification flow)
domain_entities:
  - clients
  - invoices
  - invoice_line_items
  - payments
  - recurring_schedules
  - schedule_line_items
core_capabilities:
  - client CRUD
  - invoice create/update/status
  - payment recording and status derivation
  - recurring invoice generation
  - pdf/docx export
security_model:
  - route proxy redirects unauthenticated users to /auth/login
  - authenticated-only app shell navigation
  - server-side keys required for privileged operations
critical_paths:
  - app/actions.ts
  - app/auth/*
  - app/api/*
  - lib/supabase/*
  - proxy.ts
configuration:
  env_required:
    - NEXT_PUBLIC_SUPABASE_URL
    - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    - SUPABASE_SERVICE_ROLE_KEY
    - NEXT_PUBLIC_SITE_URL
    - CRON_SECRET
```

---

## 14) Future Improvements

- Multi-tenant ownership model + strict RLS.
- Better analytics dashboard.
- Payment gateway integration.
- Email templates and notification center.
- Role-based access control for teams.
