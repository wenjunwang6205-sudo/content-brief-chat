const events = [];
const MAX = 500;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ events: events.slice(-100) });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const entry = {
    name: body?.name ?? "unknown",
    props: body?.props ?? {},
    at: new Date().toISOString(),
  };
  events.push(entry);
  if (events.length > MAX) events.shift();

  return res.status(200).json({ ok: true });
}
