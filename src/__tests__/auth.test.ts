import { describe, expect, it } from "vitest";
import {
  SESSION_TTL_MS,
  apiKeyFromHeaders,
  createSessionToken,
  isValidApiKey,
  loadApiKeys,
  refreshSessionToken,
  verifySessionToken,
} from "../lib/auth.js";

const SECRET = "test-secret";
const NOW = Date.UTC(2026, 9, 1, 12, 0, 0);

describe("API keys", () => {
  it("parses a comma-separated key list and drops blanks", () => {
    expect(loadApiKeys({ HARBOR_API_KEYS: " one, two ,," })).toEqual(["one", "two"]);
    expect(loadApiKeys({})).toEqual([]);
  });

  it("reads the key from x-api-key or a bearer header", () => {
    expect(apiKeyFromHeaders({ "x-api-key": "abc" })).toBe("abc");
    expect(apiKeyFromHeaders({ authorization: "Bearer xyz" })).toBe("xyz");
    expect(apiKeyFromHeaders({})).toBeUndefined();
  });

  it("accepts only known keys", () => {
    expect(isValidApiKey("one", ["one", "two"])).toBe(true);
    expect(isValidApiKey("three", ["one", "two"])).toBe(false);
    expect(isValidApiKey(undefined, ["one"])).toBe(false);
    expect(isValidApiKey("one", [])).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a customer id until the token expires", () => {
    const token = createSessionToken("cus_0001", SECRET, NOW);
    expect(verifySessionToken(token, SECRET, NOW + 1000)).toEqual({
      customerId: "cus_0001",
      expiresAt: NOW + SESSION_TTL_MS,
    });
    expect(verifySessionToken(token, SECRET, NOW + SESSION_TTL_MS)).toBeNull();
  });

  it("rejects tampered tokens and the wrong secret", () => {
    const token = createSessionToken("cus_0001", SECRET, NOW);
    const forged = Buffer.from(`cus_0002|${NOW + SESSION_TTL_MS}`).toString("base64url");
    expect(verifySessionToken(`${forged}.${token.split(".")[1]}`, SECRET, NOW)).toBeNull();
    expect(verifySessionToken(token, "other-secret", NOW)).toBeNull();
    expect(verifySessionToken("not-a-token", SECRET, NOW)).toBeNull();
  });

  it("refreshes a valid token with a new expiry", () => {
    const token = createSessionToken("cus_0001", SECRET, NOW);
    const later = NOW + 30 * 60 * 1000;
    const refreshed = refreshSessionToken(token, SECRET, later);
    expect(refreshed).not.toBeNull();
    expect(verifySessionToken(refreshed!, SECRET, later)?.expiresAt).toBe(later + SESSION_TTL_MS);
  });
});
