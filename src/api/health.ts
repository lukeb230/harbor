import type { ApiResponse } from "../types.js";

const startedAt = Date.now();

export function health(): ApiResponse {
  return {
    status: 200,
    body: { status: "ok", uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000) },
  };
}
