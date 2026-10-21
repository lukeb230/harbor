import { describe, expect, it } from "vitest";
import {
  berthPriceCents,
  buildInvoice,
  formatCents,
  subtotalCents,
  taxCents,
  taxRateBps,
} from "../lib/billing.js";
import type { Customer, Order } from "../types.js";

const customer: Customer = { id: "cus_0001", name: "Ada Marlow", email: "ada@example.com", country: "GB" };

const order: Order = {
  id: "ord_0001",
  customerId: "cus_0001",
  status: "paid",
  createdAt: "2026-10-01T09:00:00.000Z",
  items: [
    { sku: "BERTH-30", description: "30 ft berth, 3 nights", unitPriceCents: 13500, quantity: 1 },
    { sku: "SHORE-POWER", description: "Shore power, per night", unitPriceCents: 800, quantity: 3 },
  ],
};

describe("berth pricing", () => {
  it("charges per foot per night", () => {
    expect(berthPriceCents(30, 3)).toBe(30 * 150 * 3);
  });

  it("applies the nightly minimum to small boats", () => {
    expect(berthPriceCents(10, 2)).toBe(3000 * 2);
  });

  it("rejects non-positive inputs", () => {
    expect(() => berthPriceCents(0, 2)).toThrow();
    expect(() => berthPriceCents(30, 0)).toThrow();
  });
});

describe("totals and tax", () => {
  it("sums line items", () => {
    expect(subtotalCents(order.items)).toBe(13500 + 2400);
  });

  it("looks up tax by country and defaults to zero", () => {
    expect(taxRateBps("gb")).toBe(2000);
    expect(taxRateBps("ZZ")).toBe(0);
    expect(taxCents(15900, 2000)).toBe(3180);
  });

  it("builds an invoice with tax on the subtotal", () => {
    const invoice = buildInvoice(order, customer, new Date("2026-10-02T00:00:00.000Z"));
    expect(invoice).toEqual({
      orderId: "ord_0001",
      customerId: "cus_0001",
      currency: "USD",
      subtotalCents: 15900,
      taxRateBps: 2000,
      taxCents: 3180,
      totalCents: 19080,
      issuedAt: "2026-10-02T00:00:00.000Z",
    });
  });

  it("refuses to invoice another customer's order", () => {
    expect(() => buildInvoice(order, { ...customer, id: "cus_0002" })).toThrow();
  });

  it("formats cents as dollars", () => {
    expect(formatCents(19080)).toBe("$190.80");
    expect(formatCents(-250)).toBe("-$2.50");
  });
});
