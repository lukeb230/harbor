import type { IncomingHttpHeaders } from "node:http";

export type OrderStatus = "pending" | "paid" | "cancelled";

export interface LineItem {
  sku: string;
  description: string;
  unitPriceCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: LineItem[];
  status: OrderStatus;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  /** ISO 3166-1 alpha-2 code, used to pick a tax rate. */
  country: string;
}

export interface Invoice {
  orderId: string;
  customerId: string;
  currency: "USD";
  subtotalCents: number;
  taxRateBps: number;
  taxCents: number;
  totalCents: number;
  issuedAt: string;
}

export interface ApiRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  headers: IncomingHttpHeaders;
  body: unknown;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}

export type Handler = (req: ApiRequest) => ApiResponse | Promise<ApiResponse>;
