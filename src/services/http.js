export function json(res, code, payload) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

export async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};
  return JSON.parse(raw);
}

export function notFound(res) {
  json(res, 404, { error: "Not found" });
}

export function badRequest(res, message) {
  json(res, 400, { error: message });
}

export function serverError(res, message) {
  json(res, 500, { error: message });
}
