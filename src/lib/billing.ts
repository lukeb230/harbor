import type { Customer, Invoice, LineItem, Order } from "../types.js";

/** Berths are priced per foot of boat length per night. */
export const BERTH_RATE_CENTS_PER_FOOT = 150;
export const BERTH_MINIMUM_NIGHTLY_CENTS = 3000;

/** Tax rates in basis points (100 bps = 1%), keyed by customer country. */
export const TAX_RATES_BPS: Record<string, number> = {
  US: 0,
  GB: 2000,
  IE: 2300,
  NL: 2100,
};

export function berthPriceCents(boatLengthFeet: number, nights: number): number {
  if (boatLengthFeet <= 0 || nights <= 0) {
    throw new Error("boat length and nights must be positive");
  }
  // TODO: seasonal pricing (summer rate June to August), see docs/DECISIONS.md.
  const nightly = Math.max(boatLengthFeet * BERTH_RATE_CENTS_PER_FOOT, BERTH_MINIMUM_NIGHTLY_CENTS);
  return Math.round(nightly * nights);
}

export function lineTotalCents(item: LineItem): number {
  return item.unitPriceCents * item.quantity;
}

export function subtotalCents(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + lineTotalCents(item), 0);
}

export function taxRateBps(country: string): number {
  return TAX_RATES_BPS[country.toUpperCase()] ?? 0;
}

export function taxCents(amountCents: number, rateBps: number): number {
  return Math.round((amountCents * rateBps) / 10_000);
}

// TODO: add discount codes (percent and fixed amount), applied before tax.
export function buildInvoice(order: Order, customer: Customer, now = new Date()): Invoice {
  if (order.customerId !== customer.id) {
    throw new Error(`order ${order.id} does not belong to customer ${customer.id}`);
  }
  const subtotal = subtotalCents(order.items);
  const rate = taxRateBps(customer.country);
  const tax = taxCents(subtotal, rate);
  return {
    orderId: order.id,
    customerId: customer.id,
    currency: "USD",
    subtotalCents: subtotal,
    taxRateBps: rate,
    taxCents: tax,
    totalCents: subtotal + tax,
    issuedAt: now.toISOString(),
  };
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}
