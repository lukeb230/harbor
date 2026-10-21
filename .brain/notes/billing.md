# billing

`src/lib/billing.ts` holds all money maths. Back to [[index]].

- Amounts are integer cents in USD; tax rates are basis points (2000 = 20%) keyed by the customer's country, defaulting to 0.
- Berths cost 150 cents per foot per night with a 3000-cent nightly minimum (`berthPriceCents`).
- `buildInvoice` turns a paid order from [[orders]] plus its customer into subtotal, tax and total. Invoices are computed on request, not stored.
- Follow-ups: discount codes (percent and fixed, applied before tax) and a summer rate for June to August.

Related: [[auth]] for who may request an invoice.
