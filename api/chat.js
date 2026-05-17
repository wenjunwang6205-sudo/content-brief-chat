import { analyzeBriefSlots } from "../lib/brief-slots.js";
import { scanCompliance, looksLikePriceQuestion } from "../lib/guardrail.js";
import { chatCompletion } from "../lib/llm.js";
import {
  formatContextForPrompt,
  searchKnowledge,
} from "../lib/knowledge.js";
import { buildBriefMessages, buildQaMessages } from "../lib/prompts.js";
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
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    if (looksLikePriceQuestion(message)) {
      return res.status(200).json({
        reply:
          "知识库中未记载具体零售价或促销折扣。请在 Brief 的「待确认项」中标注「价格与促销以官方发布为准」，或联系品牌/电商运营确认。",
        citations: searchKnowledge("compliance 价格 促销", 2).map(
          ({ docId, title, snippet }) => ({ docId, title, snippet }),
        ),
        brief: null,
        needClarification: false,
        clarificationQuestions: [],
        guardrail: { triggered: true, hits: ["价格/折扣问询"] },
      });
    }

    if (mode === "brief") {
      const slots = analyzeBriefSlots(message);
      if (!slots.complete) {
        return res.status(200).json({
          reply: "生成 Brief 前还需要一些信息：",
          citations: [],
          brief: null,
          needClarification: true,
          clarificationQuestions: slots.clarificationQuestions,
          guardrail: { triggered: false, hits: [] },
        });
      }
    }

    const citations = searchKnowledge(message, 5);
    const contextBlock =
      citations.length > 0
        ? formatContextForPrompt(citations)
        : "（未检索到相关片段，请谨慎回答并提示知识库可能不完整）";

    const messages =
      mode === "brief"
        ? buildBriefMessages({ request: message, contextBlock })
        : buildQaMessages({ query: message, contextBlock });

    const rawReply = await chatCompletion(messages);
    const guard = scanCompliance(rawReply);

    let reply = rawReply;
    if (guard.triggered && guard.suggestion) {
      reply = `${rawReply}\n\n---\n**合规提示：** ${guard.suggestion}`;
    }

    const citationPayload = citations.map(({ docId, title, snippet }) => ({
      docId,
      title,
      snippet,
    }));

    if (mode === "brief") {
      return res.status(200).json({
        reply: guard.triggered
          ? "已生成 Brief 草案，请查看下方内容并注意合规提示。"
          : "已生成 Brief 草案，请确认后导出。",
        citations: citationPayload,
        brief: { markdown: reply },
        needClarification: false,
        clarificationQuestions: [],
        guardrail: guard,
      });
    }

    return res.status(200).json({
      reply,
      citations: citationPayload,
      brief: null,
      needClarification: false,
      clarificationQuestions: [],
      guardrail: guard,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("LLM_API_KEY")) {
      return res.status(503).json({
        error: "LLM not configured",
        hint: "Set LLM_API_KEY on Vercel",
      });
    }
    console.error(e);
    return res.status(500).json({ error: "Internal error", detail: msg });
  }
}
