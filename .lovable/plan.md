## Goal

Turn the ERP shell into a real working app: Lovable Cloud backend, email/password auth, and full Create/Read/Update/Delete on every business module. Data persists per organization, scoped by RLS.

## Approach

The app has ~30 modules. Building bespoke forms for each would take many turns. Instead I'll:

1. **Build the backend once** — schema + RLS + grants for every entity in a single migration.
2. **Build a generic CRUD engine** — one reusable `<DataModule>` component (list + search + add/edit dialog + delete) driven by a per-module schema (fields, types, validation). Every module page becomes ~20 lines that declares its schema.
3. **Keep the 3 hand-built showcase pages** (Invoices, Journal Entries, Leads kanban) and wire them to the real backend.

This gets you actually-working CRUD on everything without 30 bespoke forms.

## Phase 1 — Foundation

- Enable Lovable Cloud.
- Auth: email/password sign-in/sign-up at `/auth`; managed `_authenticated` gate protects all app routes.
- `profiles` table (id, full_name, avatar_url, company_name).
- `user_roles` table + `app_role` enum (`admin`, `member`) + `has_role()` security-definer function.
- Auto-create profile + default `member` role on signup via trigger.

## Phase 2 — Schema (one migration, all tables)

All tables get `user_id uuid` (owner), `created_at`, `updated_at`. RLS: owner can CRUD own rows; admins see all. Grants to `authenticated` + `service_role`.

**Accounting:** `accounts` (chart of accounts), `journal_entries` + `journal_lines`
**Sales:** `customers`, `quotations`, `sales_orders`, `invoices` + `invoice_items`, `payments`
**Purchases:** `vendors`, `purchase_orders`, `bills`, `expenses`
**Inventory:** `warehouses`, `product_categories`, `products`, `stock_movements`
**CRM:** `leads`, `opportunities`, `crm_activities`
**HRMS:** `employees`, `attendance`, `leaves`, `payroll`

## Phase 3 — Generic CRUD engine

`src/lib/crud/` :
- `types.ts` — `ModuleSchema<T>` (table name, columns, fields with type/validation/options)
- `useCrud.ts` — TanStack Query hooks: `useList`, `useCreate`, `useUpdate`, `useDelete` (all hit Supabase client directly under RLS)
- `DataModule.tsx` — header + search/filter toolbar + responsive table + add/edit dialog (auto-generates form from schema with Zod validation) + delete confirm + loading skeletons + empty state + error state + toast notifications

Each existing route file becomes:

```tsx
export const Route = createFileRoute('/sales/customers')({ component: Page });
function Page() { return <DataModule schema={customersSchema} />; }
```

Schemas live in `src/lib/crud/schemas/*.ts` — one file per module, ~30 lines each.

## Phase 4 — Hand-built showcase pages (rewired)

- **Invoices**: keep current builder UI, persist to `invoices` + `invoice_items`. List view added.
- **Journal Entries**: keep current double-entry form, persist to `journal_entries` + `journal_lines`. List view added.
- **Leads Kanban**: keep current kanban, drag updates `leads.stage`.

## Phase 5 — Dashboard

Executive dashboard reads real aggregates from the user's data (sums from `invoices`, `bills`, `customers`, `products` stock levels). Charts gracefully show "No data yet" empty states.

## What you'll be able to do after this ships

- Sign up, sign in, sign out.
- On every module: search, sort, add, edit, delete records with validation; data persists across reloads and is private to your account.
- Build real invoices and journal entries that save and list.
- Move leads across kanban stages.
- See live KPIs on the dashboard from your own data.

## Out of scope (call out so expectations match)

- PDF generation, email sending, payments, GST e-filing, multi-company switching, file uploads, audit logs, granular per-field permissions, reports beyond simple aggregates. These can each be follow-up tasks.

## Heads up

This is a large build — expect it to take a few sequential turns to land cleanly (migration → engine → schemas wired into routes → showcase pages → dashboard). I'll ship phases in order and you'll see each one working in the preview as it lands.
