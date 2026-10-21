# Harbor second brain

Harbor is Northwind's orders and billing API for marina berth bookings. Start here, then follow the links.

## Modules
- [[auth]] — API keys for every protected route, signed session tokens for customer clients.
- [[billing]] — berth prices, tax by country, invoice totals.
- [[orders]] — the in-memory order store and its status rules.

## Where things live
- HTTP server and routes: `src/server.ts`, `src/router.ts`, handlers in `src/api/`.
- Shared logic: `src/lib/`.
- Decisions and the reasons behind them: `docs/DECISIONS.md`.

## Open threads
- Refresh tokens do not check expiry yet, see [[auth]].
- Discount codes and seasonal pricing, see [[billing]].
- Postgres to replace the in-memory store, see [[orders]].
