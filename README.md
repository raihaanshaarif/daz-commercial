# Voice Shipment Tracker

A shipment & invoice payment-tracking app that replaces the "Voice Shipment
Summary.xlsx" workflow. Track buyers, factories, invoices (with multiple order
numbers), and — the key feature — **batch payments received against many
invoices at once**, allocated per-invoice with automatic Pending / Partial /
Completed status rollup.

## Stack

- **Next.js 16** (App Router, React Server Components, Server Actions) + **React 19**
- **TypeScript** (strict)
- **PostgreSQL** via **Prisma 7** (driver-adapter `@prisma/adapter-pg`)
- **Tailwind CSS v4** + **shadcn/ui** + **Framer Motion** (`motion`)

## Getting started

```bash
npm install                 # also runs `prisma generate` (postinstall)

# 1. Start the local Postgres (Prisma Postgres dev server), detached:
npm run db:dev              # == prisma dev --detach --name daz

# 2. Point the app at it. Run:
npx prisma dev ls
#    Copy the URL under **TCP** (a direct postgres://…:PORT/template1 string)
#    into DATABASE_URL in .env, and the **shadow** TCP url into SHADOW_DATABASE_URL.

# 3. Sync the schema:
npm run db:push            # == prisma db push

# 4. Create the default admin account:
npm run db:seed
#    Default credentials (override with ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME):
#      email:    admin@voice.local
#      password: ChangeMe123!    ← change this after first login

# 5. Run the app:
npm run dev                # http://localhost:3000  → redirects to /login
```

## Authentication & users

Custom, self-hosted auth — no third-party service.

- **Login** at `/login` (email + password). Passwords are hashed with Node's
  built-in `scrypt`; sessions are DB-backed (`Session` table) with an httpOnly
  cookie, so they can be revoked. The whole app is gated: unauthenticated
  requests redirect to `/login`.
- **Default admin** is created by `npm run db:seed` (set `ADMIN_EMAIL` /
  `ADMIN_PASSWORD` in `.env` to control it). The app ships with just this one
  account.
- **Managing users**: an admin opens **Users** in the nav (`/users`) to create
  accounts and assign a role:
  - `ADMIN` — full access **plus** user management.
  - `USER` — full access to shipments and payments, but **not** user management.
  Deleting a user signs them out immediately. You can't delete yourself or the
  last remaining admin.
- Every mutation (shipments, payments, buyers/factories) requires a signed-in
  user; user-management actions additionally require an admin.

Auth code lives in [src/lib/auth/](src/lib/auth/) (`password.ts`, `session.ts`),
[src/actions/auth.ts](src/actions/auth.ts), and
[src/actions/users.ts](src/actions/users.ts). Authenticated pages live under the
`src/app/(app)/` route group whose layout enforces `requireUser()`.

### ⚠️ Prisma 7 + local dev server notes (important)

- **The client needs a *direct TCP* connection string**, not the HTTP
  `prisma+postgres://…` proxy URL. The proxy URL is rejected at query time
  ("Using an HTTP connection string is not supported"). Always use the **TCP**
  url from `prisma dev ls` for `DATABASE_URL`.
- **The port and credentials change every time the dev server restarts.** After
  a restart, re-run `prisma dev ls` and update `.env`.
- `prisma migrate dev` can be flaky against the local dev server (P1017). We use
  `prisma db push` for the local workflow; a baseline SQL migration is committed
  under `prisma/migrations/` for reference. Against a hosted Postgres,
  `prisma migrate dev` works normally.

### Production

Set `DATABASE_URL` to any hosted Postgres connection string and run
`npx prisma migrate deploy` (or `prisma db push`). No code changes needed — the
client uses the `@prisma/adapter-pg` driver adapter (`src/lib/prisma.ts`).

## Project structure

```
prisma/schema.prisma              Data model (Buyer, Factory, Shipment,
                                  ShipmentOrder, Payment, PaymentAllocation)
src/generated/prisma/             Generated Prisma client (gitignored)
src/lib/
  prisma.ts                       PrismaClient singleton (pg adapter)
  validations.ts                  zod schemas
  types.ts                        shared types + ActionState
  format.ts                       money/date formatters, status helpers
  search-params.ts                URL <-> filter (de)serialization
  queries/                        RSC read layer (shipments, dashboard, payments, entities)
src/actions/                      Server Actions (entities, shipments, payments)
src/components/
  dashboard/kpi-grid.tsx          Bento KPI overview (Framer Motion)
  shipments/                      Table, toolbar/filters, pagination, form, row actions
  payments/                       Merged payment allocator + payment list
  entities/entity-dialog.tsx      Quick-add Buyer/Factory modal
  shared/                         Date picker, confirm dialog
src/app/
  page.tsx                        Dashboard (KPIs + filterable table)
  shipments/new, shipments/[id]/edit
  payments, payments/new
```

## How payments work

Mirrors the original spreadsheet, where one payment's cell was merged across the
group of invoice rows it settled.

- A `Payment` records **amount + currency (default BDT) + receive date +
  details**. The amount is **not** reconciled against `Shipment.amount` (the
  factory's invoice value — the factory is paid that directly, we never collect
  it) or against `Shipment.lac` — it can differ (renegotiation, unrecorded bank
  charges) by design. There is **no balance / outstanding / partial** tracking.
- **`Shipment.amount`** = factory's invoice value (informational only).
  **`Shipment.lac`** = the value we actually collect; it's what the payment
  form's reference total and the dashboard's LAC stats are based on — never
  `amount`.
- A `Shipment` links to at most one `Payment` (`Shipment.paymentId`). Status is
  **derived**: linked ⇒ **Received**, otherwise **Pending**.
- The payment form (`/payments/new`) is: enter amount/date/details, then tick the
  unpaid invoices it settles. Submitting connects those invoices to the payment
  (`src/actions/payments.ts`).
- On the dashboard table, invoices sharing one payment render as a **single
  merged cell** spanning their rows (`rowSpan`, computed in
  `src/components/shipments/shipment-table.tsx`) — the Excel look.
- Deleting a payment marks its invoices unpaid again (`onDelete: SetNull`).

## Notes

- Invoice amounts are `Float` USD; payment amounts are `Float` in whatever
  currency you type (label defaults to `BDT`). Switch to `Decimal` in
  `schema.prisma` if you ever need exact minor-unit precision.
