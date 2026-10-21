# Decisions

Engineering decisions for Harbor, newest first.

## 2026-10-14 — Money as integer cents, tax as basis points

All prices, subtotals and totals are integer cents, and tax rates are stored in basis points (100 bps = 1%). Floating-point dollars gave rounding drift on multi-night bookings in the prototype. Tax is rounded once, on the invoice subtotal, not per line. Currency is USD only for now; multi-currency waits until Northwind opens a second marina.

## 2026-10-09 — No web framework

Harbor uses `node:http` with a small hand-written router (`src/router.ts`) instead of Express or Fastify. The API has about a dozen routes, and keeping zero runtime dependencies makes the service easy to audit and quick to start. We will revisit if we need middleware we would otherwise have to write ourselves (rate limiting, OpenAPI).

## 2026-10-06 — In-memory store until Postgres lands

Orders and customers live in in-memory maps (`src/lib/orders.ts`, `src/api/customers.ts`). The bookings schema is still changing weekly, and a database now would mean migrations on every change. The store functions are written so that swapping in Postgres later only changes their bodies, not their callers. Accepted cost: all data is lost on restart, so Harbor is not used for real bookings yet.
