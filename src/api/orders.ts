import { subtotalCents } from "../lib/billing.js";
import { createOrder, getOrder as findOrder, listOrders as allOrders, setOrderStatus } from "../lib/orders.js";
import { validateOrderInput } from "../lib/validate.js";
import type { ApiRequest, ApiResponse, Order, OrderStatus } from "../types.js";
import { findCustomer } from "./customers.js";

function withSubtotal(order: Order) {
  return { ...order, subtotalCents: subtotalCents(order.items) };
}

export function listOrders(req: ApiRequest): ApiResponse {
  const customerId = req.query.get("customerId") ?? undefined;
  return { status: 200, body: { orders: allOrders(customerId).map(withSubtotal) } };
}

export function getOrder(req: ApiRequest): ApiResponse {
  const order = findOrder(req.params.id);
  if (!order) return { status: 404, body: { error: "order not found" } };
  return { status: 200, body: withSubtotal(order) };
}

export function postOrder(req: ApiRequest): ApiResponse {
  const result = validateOrderInput(req.body);
  if (!result.ok) return { status: 400, body: { errors: result.errors } };
  if (!findCustomer(result.value.customerId)) {
    return { status: 400, body: { errors: ["customerId does not match a customer"] } };
  }
  return { status: 201, body: withSubtotal(createOrder(result.value)) };
}

function changeStatus(req: ApiRequest, status: OrderStatus): ApiResponse {
  if (!findOrder(req.params.id)) return { status: 404, body: { error: "order not found" } };
  try {
    return { status: 200, body: withSubtotal(setOrderStatus(req.params.id, status)) };
  } catch (error) {
    return { status: 409, body: { error: (error as Error).message } };
  }
}

export const payOrder = (req: ApiRequest) => changeStatus(req, "paid");
export const cancelOrder = (req: ApiRequest) => changeStatus(req, "cancelled");
