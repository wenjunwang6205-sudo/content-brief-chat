import express from "express";
import chat from "../api/chat.js";
import chatStream from "../api/chat-stream.js";
import citation from "../api/citation.js";
import event from "../api/event.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

function wrap(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

app.options("/api/*", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(204).end();
});

app.post("/api/chat", wrap(chat));
app.post("/api/chat-stream", wrap(chatStream));
app.get("/api/citation", wrap(citation));
app.get("/api/event", wrap(event));
app.post("/api/event", wrap(event));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal error" });
  }
});

const port = Number(process.env.PORT) || 9000;
app.listen(port, "0.0.0.0", () => {
  console.log(`SCF Web server on 0.0.0.0:${port}`);
});
