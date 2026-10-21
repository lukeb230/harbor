# Harbor

Harbor is a tiny orders and billing API for Northwind, a fictional company that rents marina berths to boat owners. It keeps customers and berth-booking orders, works out prices and tax, and issues invoices. It is deliberately small: plain Node 22 and TypeScript on `node:http`, no web framework, and an in-memory store until Postgres lands (see `docs/DECISIONS.md`).

To run it, use Node 22 and `npm install`, then start the dev server with an API key: `HARBOR_API_KEYS=local-dev-key npm run dev`. The server listens on `PORT` (default 3000); every route except `GET /health` needs an `x-api-key` header that matches one of the comma-separated keys in `HARBOR_API_KEYS`. Session tokens are signed with `HARBOR_SESSION_SECRET` (a random per-process secret is used when it is unset). Run `npm test` for the unit tests and `npm run typecheck` for the type check.

Layout: `src/server.ts` is the HTTP server and `src/router.ts` maps routes to handlers in `src/api/` (orders, customers, invoices, health). Shared logic lives in `src/lib/`: `auth.ts` (API keys and session tokens), `billing.ts` (prices, tax, invoice totals), `orders.ts` (the order store) and `validate.ts` (request body checks). Types are in `src/types.ts`, tests in `src/__tests__/`, engineering decisions in `docs/DECISIONS.md`, and the team's second brain in `.brain/`.
