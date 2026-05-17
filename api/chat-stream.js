import { formatCitationsForClient } from "../lib/citations-format.js";
import { scanCompliance } from "../lib/guardrail.js";
import { normalizeHistory } from "../lib/history.js";
import { streamChatCompletion } from "../lib/llm.js";
import { detectIntent } from "../lib/intent.js";
import {
  formatContextForPrompt,
  searchKnowledge,
} from "../lib/knowledge.js";
import { buildQaMessages } from "../lib/prompts.js";
import { checkRateLimit } from "../lib/rate-limit.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const limit = checkRateLimit(clientIp(req));
  if (!limit.ok) {
    return res.status(429).json({
      error: "Too many requests",
      retryAfterSec: limit.retryAfterSec,
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const mode = body?.mode === "brief" ? "brief" : "qa";
    const message = (body?.message ?? "").trim();
    const previousBrief = (body?.previousBrief ?? "").trim();
    const taskStateIn = body?.taskState ?? "idle";
    const conversation = normalizeHistory(body?.history, message);

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const { intent } = detectIntent({
      message,
      mode,
      hasPreviousBrief: previousBrief.length > 100,
      taskState: taskStateIn,
    });

    if (intent !== "knowledge_qa") {
      return res.status(400).json({
        error: "stream_not_supported",
        hint: "流式仅支持知识问答；Brief/修订请使用 POST /api/chat",
        intent,
      });
    }

    const citations = searchKnowledge(message, 5);
    const contextBlock =
      citations.length > 0
        ? formatContextForPrompt(citations)
        : "（未检索到相关片段，请谨慎回答并提示知识库可能不完整）";

    const messages = buildQaMessages({
      query: message,
      contextBlock,
      history: conversation,
    });

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    writeSse(res, "meta", {
      intent: "knowledge_qa",
      citations: formatCitationsForClient(citations),
    });

    let fullText = "";
    for await (const chunk of streamChatCompletion(messages)) {
      fullText += chunk;
      writeSse(res, "delta", { text: chunk });
    }

    const guard = scanCompliance(fullText);
    let reply = fullText;
    if (guard.triggered && guard.suggestion) {
      reply = `${fullText}\n\n---\n**合规提示：** ${guard.suggestion}`;
    }

    writeSse(res, "done", {
      reply,
      intent: "knowledge_qa",
      taskState: "idle",
      citations: formatCitationsForClient(citations),
      guardrail: guard,
      needClarification: false,
      clarificationQuestions: [],
      brief: null,
      briefRevision: null,
    });

    res.end();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("LLM_API_KEY")) {
      return res.status(503).json({
        error: "LLM not configured",
        hint: "Set LLM_API_KEY on Vercel",
      });
    }
    console.error(e);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal error", detail: msg });
    }
    writeSse(res, "error", { message: msg });
    res.end();
  }
}
