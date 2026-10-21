import { createSessionToken, sessionSecret } from "../lib/auth.js";
import { validateCustomerInput } from "../lib/validate.js";
import type { ApiRequest, ApiResponse, Customer } from "../types.js";

// Fictional sample customers so the API has something to show on first run.
const customers = new Map<string, Customer>([
  ["cus_0001", { id: "cus_0001", name: "Ada Marlow", email: "ada@example.com", country: "GB" }],
  ["cus_0002", { id: "cus_0002", name: "Theo Brandt", email: "theo@example.com", country: "NL" }],
]);
let nextId = customers.size + 1;

export function findCustomer(id: string): Customer | undefined {
  return customers.get(id);
}

export function listCustomers(): ApiResponse {
  return { status: 200, body: { customers: [...customers.values()] } };
}

export function getCustomer(req: ApiRequest): ApiResponse {
  const customer = customers.get(req.params.id);
  if (!customer) return { status: 404, body: { error: "customer not found" } };
  return { status: 200, body: customer };
}

export function createCustomer(req: ApiRequest): ApiResponse {
  const result = validateCustomerInput(req.body);
  if (!result.ok) return { status: 400, body: { errors: result.errors } };
  const customer: Customer = { id: `cus_${String(nextId++).padStart(4, "0")}`, ...result.value };
  customers.set(customer.id, customer);
  return { status: 201, body: customer };
}

/** Issues a short-lived session token for a customer-facing client. */
export function createCustomerSession(req: ApiRequest): ApiResponse {
  const customer = customers.get(req.params.id);
  if (!customer) return { status: 404, body: { error: "customer not found" } };
  const token = createSessionToken(customer.id, sessionSecret());
  return { status: 201, body: { token } };
}
