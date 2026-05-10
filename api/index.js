import { Readable } from "node:stream";

export default async function handler(req, res) {
  const mod = await import("../frontend/dist/server/server.js");
  const fetchHandler = mod.default?.fetch || mod.fetch;

  if (!fetchHandler) {
    res.statusCode = 500;
    res.end("Server export missing fetch handler");
    return;
  }

  // If Vercel passes a standard Web Request (some newer Node versions on Vercel do if length === 1, but we took 2)
  if (req instanceof Request) {
    const webRes = await fetchHandler(req);
    return webRes;
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const url = `${protocol}://${host}${req.url}`;
  
  const init = {
    method: req.method,
    headers: req.headers,
    // Provide a dummy abort controller to prevent some frameworks from crashing
    signal: new AbortController().signal
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    // Vercel node req is an IncomingMessage
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    init.body = Buffer.concat(chunks);
  }

  const webReq = new Request(url, init);
  const webRes = await fetchHandler(webReq);

  res.statusCode = webRes.status;
  res.statusMessage = webRes.statusText;

  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (webRes.body) {
    // webRes.body is a ReadableStream
    const reader = webRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}
