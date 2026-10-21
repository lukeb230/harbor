import type { LineItem, Order, OrderStatus } from "../types.js";

// In-memory until Postgres lands (docs/DECISIONS.md, 2026-10-06).
const orders = new Map<string, Order>();
let nextId = 1;

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

export interface NewOrder {
  customerId: string;
  items: LineItem[];
}

export function createOrder(input: NewOrder, now = new Date()): Order {
  const order: Order = {
    id: `ord_${String(nextId++).padStart(4, "0")}`,
    customerId: input.customerId,
    items: input.items.map((item) => ({ ...item })),
    status: "pending",
    createdAt: now.toISOString(),
  };
  orders.set(order.id, order);
  return order;
}

export function getOrder(id: string): Order | undefined {
  return orders.get(id);
}

export function listOrders(customerId?: string): Order[] {
  const all = [...orders.values()];
  return customerId ? all.filter((order) => order.customerId === customerId) : all;
}

export function setOrderStatus(id: string, status: OrderStatus): Order {
  const order = orders.get(id);
  if (!order) throw new Error(`order ${id} not found`);
  if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
    throw new Error(`cannot move order ${id} from ${order.status} to ${status}`);
  }
  order.status = status;
  return order;
}

/** Test helper: empties the store and restarts ids. */
export function resetOrders(): void {
  orders.clear();
  nextId = 1;
}
