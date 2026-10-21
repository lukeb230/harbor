# auth

`src/lib/auth.ts` guards the API. Back to [[index]].

- **API keys**: every route except `GET /health` needs a key from `HARBOR_API_KEYS` (comma-separated), sent as `x-api-key` or `Authorization: Bearer`. Keys are compared in constant time.
- **Session tokens**: `POST /customers/:id/session` issues a one-hour token signed with HMAC-SHA256 using `HARBOR_SESSION_SECRET`. Without that variable a random per-process secret is used, so tokens die on restart.
- **Known gap**: `refreshSessionToken` re-issues any correctly signed token, even an expired one. Validating expiry (with a short grace window) is the next piece of work here.
- Customer handlers in `src/api/customers.ts` call into this module; [[billing]] does not depend on it.

Related: [[orders]] (orders are not yet scoped to a session's customer).
