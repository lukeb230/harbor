import { beforeEach, describe, expect, it } from "vitest";
import { createOrder, getOrder, listOrders, resetOrders, setOrderStatus } from "../lib/orders.js";
import { validateOrderInput } from "../lib/validate.js";

const item = { sku: "BERTH-30", description: "30 ft berth, 1 night", unitPriceCents: 4500, quantity: 1 };

beforeEach(() => {
  resetOrders();
});

describe("order store", () => {
  it("creates pending orders with sequential ids", () => {
    const first = createOrder({ customerId: "cus_0001", items: [item] });
    const second = createOrder({ customerId: "cus_0002", items: [item] });
    expect(first.id).toBe("ord_0001");
    expect(second.id).toBe("ord_0002");
    expect(first.status).toBe("pending");
    expect(getOrder("ord_0001")).toBe(first);
  });

  it("filters orders by customer", () => {
    createOrder({ customerId: "cus_0001", items: [item] });
    createOrder({ customerId: "cus_0002", items: [item] });
    expect(listOrders("cus_0001")).toHaveLength(1);
    expect(listOrders()).toHaveLength(2);
  });

  it("allows pending to paid but not paid to cancelled", () => {
    const order = createOrder({ customerId: "cus_0001", items: [item] });
    expect(setOrderStatus(order.id, "paid").status).toBe("paid");
    expect(() => setOrderStatus(order.id, "cancelled")).toThrow(/cannot move/);
  });

  it("throws for an unknown order", () => {
    expect(() => setOrderStatus("ord_9999", "paid")).toThrow(/not found/);
  });
});

describe("order validation", () => {
  it("accepts a well-formed order", () => {
    const result = validateOrderInput({ customerId: "cus_0001", items: [item] });
    expect(result.ok).toBe(true);
  });

  it("lists every problem with a bad order", () => {
    const result = validateOrderInput({ items: [{ sku: "", quantity: 0 }] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("customerId is required");
      expect(result.errors).toContain("items[0].quantity must be a positive integer");
    }
  });
});
