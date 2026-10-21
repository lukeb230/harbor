# orders

`src/lib/orders.ts` is the order store. Back to [[index]].

- Orders live in a `Map` in memory, with ids like `ord_0001`. Everything is lost on restart; this is deliberate until Postgres lands (see `docs/DECISIONS.md`).
- Status moves only `pending → paid` or `pending → cancelled`; `paid` and `cancelled` are final.
- Request bodies are checked by `src/lib/validate.ts` before an order is created, and the customer must exist.
- Paid orders feed [[billing]] to produce invoices.

Related: [[auth]] (API key required for every order route).
