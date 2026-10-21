import type { LineItem } from "../types.js";

export type Validation<T> = { ok: true; value: T } | { ok: false; errors: string[] };

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateOrderInput(body: unknown): Validation<{ customerId: string; items: LineItem[] }> {
  if (!isRecord(body)) return { ok: false, errors: ["body must be a JSON object"] };
  const errors: string[] = [];
  if (!isNonEmptyString(body.customerId)) errors.push("customerId is required");
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push("items must be a non-empty array");
  } else {
    body.items.forEach((item: unknown, index: number) => {
      if (!isRecord(item)) {
        errors.push(`items[${index}] must be an object`);
        return;
      }
      if (!isNonEmptyString(item.sku)) errors.push(`items[${index}].sku is required`);
      if (!isNonEmptyString(item.description)) errors.push(`items[${index}].description is required`);
      if (!isPositiveInteger(item.unitPriceCents)) errors.push(`items[${index}].unitPriceCents must be a positive integer`);
      if (!isPositiveInteger(item.quantity)) errors.push(`items[${index}].quantity must be a positive integer`);
    });
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { customerId: body.customerId as string, items: body.items as LineItem[] } };
}

export function validateCustomerInput(body: unknown): Validation<{ name: string; email: string; country: string }> {
  if (!isRecord(body)) return { ok: false, errors: ["body must be a JSON object"] };
  const errors: string[] = [];
  if (!isNonEmptyString(body.name)) errors.push("name is required");
  if (!isNonEmptyString(body.email) || !body.email.includes("@")) errors.push("email must be an email address");
  if (typeof body.country !== "string" || !/^[A-Za-z]{2}$/.test(body.country)) {
    errors.push("country must be a two-letter country code");
  }
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { name: body.name as string, email: body.email as string, country: (body.country as string).toUpperCase() },
  };
}
