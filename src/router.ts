import { createCustomer, createCustomerSession, getCustomer, listCustomers } from "./api/customers.js";
import { health } from "./api/health.js";
import { getInvoice, listCustomerInvoices } from "./api/invoices.js";
import { cancelOrder, getOrder, listOrders, payOrder, postOrder } from "./api/orders.js";
import type { Handler } from "./types.js";

interface Route {
  method: string;
  segments: string[];
  handler: Handler;
  public: boolean;
}

export interface Match {
  handler: Handler;
  params: Record<string, string>;
  public: boolean;
}

export class Router {
  private routes: Route[] = [];

  add(method: string, pattern: string, handler: Handler, options: { public?: boolean } = {}): this {
    this.routes.push({ method, segments: split(pattern), handler, public: options.public ?? false });
    return this;
  }

  match(method: string, path: string): Match | null {
    const segments = split(path);
    for (const route of this.routes) {
      if (route.method !== method || route.segments.length !== segments.length) continue;
      const params: Record<string, string> = {};
      const matched = route.segments.every((part, i) => {
        if (part.startsWith(":")) {
          params[part.slice(1)] = decodeURIComponent(segments[i]);
          return true;
        }
        return part === segments[i];
      });
      if (matched) return { handler: route.handler, params, public: route.public };
    }
    return null;
  }
}

function split(path: string): string[] {
  return path.split("/").filter((part) => part.length > 0);
}

export function buildRouter(): Router {
  return new Router()
    .add("GET", "/health", health, { public: true })
    .add("GET", "/customers", listCustomers)
    .add("POST", "/customers", createCustomer)
    .add("GET", "/customers/:id", getCustomer)
    .add("POST", "/customers/:id/session", createCustomerSession)
    .add("GET", "/customers/:id/invoices", listCustomerInvoices)
    .add("GET", "/orders", listOrders)
    .add("POST", "/orders", postOrder)
    .add("GET", "/orders/:id", getOrder)
    .add("POST", "/orders/:id/pay", payOrder)
    .add("POST", "/orders/:id/cancel", cancelOrder)
    .add("GET", "/orders/:id/invoice", getInvoice);
}
