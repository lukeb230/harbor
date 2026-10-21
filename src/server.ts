import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { apiKeyFromHeaders, isValidApiKey, loadApiKeys } from "./lib/auth.js";
import { buildRouter } from "./router.js";
import type { ApiResponse } from "./types.js";

const MAX_BODY_BYTES = 1_000_000;
const router = buildRouter();
const apiKeys = loadApiKeys();

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("body too large");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function send(res: ServerResponse, response: ApiResponse): void {
  res.writeHead(response.status, { "content-type": "application/json" });
  res.end(JSON.stringify(response.body));
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const method = req.method ?? "GET";
  const match = router.match(method, url.pathname);
  if (!match) return send(res, { status: 404, body: { error: "not found" } });

  if (!match.public && !isValidApiKey(apiKeyFromHeaders(req.headers), apiKeys)) {
    return send(res, { status: 401, body: { error: "missing or invalid API key" } });
  }

  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    return send(res, { status: 400, body: { error: "body must be valid JSON under 1 MB" } });
  }

  const response = await match.handler({
    method,
    path: url.pathname,
    params: match.params,
    query: url.searchParams,
    headers: req.headers,
    body,
  });
  send(res, response);
}

const port = Number(process.env.PORT ?? 3000);

createServer((req, res) => {
  handle(req, res).catch((error: unknown) => {
    console.error(error);
    send(res, { status: 500, body: { error: "internal error" } });
  });
}).listen(port, () => {
  if (apiKeys.length === 0) console.warn("HARBOR_API_KEYS is empty: every protected route will return 401.");
  console.log(`harbor listening on http://localhost:${port}`);
});
