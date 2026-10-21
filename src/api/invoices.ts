import { buildInvoice } from "../lib/billing.js";
import { getOrder, listOrders } from "../lib/orders.js";
import type { ApiRequest, ApiResponse } from "../types.js";
import { findCustomer } from "./customers.js";

/** GET /orders/:id/invoice — invoices exist only for paid orders. */
export function getInvoice(req: ApiRequest): ApiResponse {
  const order = getOrder(req.params.id);
  if (!order) return { status: 404, body: { error: "order not found" } };
  if (order.status !== "paid") return { status: 409, body: { error: "order is not paid yet" } };
  const customer = findCustomer(order.customerId);
  if (!customer) return { status: 404, body: { error: "customer not found" } };
  return { status: 200, body: buildInvoice(order, customer) };
}

/** GET /customers/:id/invoices — every paid order for one customer. */
export function listCustomerInvoices(req: ApiRequest): ApiResponse {
  const customer = findCustomer(req.params.id);
  if (!customer) return { status: 404, body: { error: "customer not found" } };
  const invoices = listOrders(customer.id)
    .filter((order) => order.status === "paid")
    .map((order) => buildInvoice(order, customer));
  return { status: 200, body: { invoices } };
}
