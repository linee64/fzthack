export default async function handler(req, res) {
  const server = await import("../frontend/dist/server/server.js");
  const fn = server.default || server.handler || server;
  return fn(req, res);
}
