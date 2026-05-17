import { analyzeBriefSlotsFromText } from "../lib/brief-slots.js";
import {
  computeBriefDiff,
  stripRevisionSummary,
} from "../lib/brief-diff.js";
import { formatCitationsForClient } from "../lib/citations-format.js";
import { scanCompliance, looksLikePriceQuestion } from "../lib/guardrail.js";
import {
  mergeHistoryForSlots,
  normalizeHistory,
} from "../lib/history.js";
import { chatCompletion } from "../lib/llm.js";
import { detectIntent } from "../lib/intent.js";
import {
  formatContextForPrompt,
  searchKnowledge,
} from "../lib/knowledge.js";
import {
  buildBriefMessages,
  buildBriefRefineMessages,
  buildQaMessages,
} from "../lib/prompts.js";
import { checkRateLimit } from "../lib/rate-limit.js";

const CHITCHAT_REPLY = `我是 **ContentBrief Chat**，面向内容团队的企业级助手演示。

我可以帮你：
1. **知识问答** — 品牌调性、渠道规范、合规要求（回答带引用来源）
2. **活动 Brief** — 根据活动信息生成结构化 Content Brief
3. **Brief 修订** — 在已有 Brief 上按你的指令修改（如调整人群、渠道）
4. **导出交付** — 确认后导出 Markdown

直接在下方输入问题，或点击建议芯片开始。`;

const HANDOFF_REPLY = `已记录你的转人工请求（演示环境）。

建议在正式环境中通过 **内容中台值班** 或 **内部工单系统** 提交，并附上会话摘要。当前演示无法连接真实工单。`;

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

function basePayload(extra = {}) {
  return {
    needClarification: false,
    clarificationQuestions: [],
    needIntentConfirm: false,
    intentOptions: [],
    brief: null,
    briefRevision: null,
    taskCompleted: false,
    guardrail: { triggered: false, hits: [] },
    ...extra,
  };
}

function mapCitations(raw) {
  return formatCitationsForClient(raw);
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
    const action = body?.action;
    const mode = body?.mode === "brief" ? "brief" : "qa";
    const message = (body?.message ?? "").trim();
    const previousBrief = (body?.previousBrief ?? "").trim();
    const taskStateIn = body?.taskState ?? "idle";
    const hasPreviousBrief = previousBrief.length > 100;
    const conversation = normalizeHistory(body?.history, message);

    if (action === "complete_task") {
      return res.status(200).json(
        basePayload({
          reply: "任务已标记为完成。感谢使用，如需新任务请点击「新对话」。",
          intent: "brief_create",
          taskState: "completed",
          taskCompleted: true,
          citations: [],
        }),
      );
    }

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const { intent } = detectIntent({
      message,
      mode,
      hasPreviousBrief,
      taskState: taskStateIn,
    });

    if (intent === "chitchat") {
      return res.status(200).json(
        basePayload({
          reply: CHITCHAT_REPLY,
          intent,
          taskState: taskStateIn,
          citations: [],
        }),
      );
    }

    if (intent === "handoff_human") {
      return res.status(200).json(
        basePayload({
          reply: HANDOFF_REPLY,
          intent,
          taskState: taskStateIn,
          citations: [],
        }),
      );
    }

    if (intent === "policy_block" || looksLikePriceQuestion(message)) {
      return res.status(200).json(
        basePayload({
          reply:
            "知识库中未记载具体零售价或促销折扣，且不宜使用绝对化用语。请在 Brief「待确认项」标注「价格与促销以官方发布为准」，或调整表述。",
          intent: "policy_block",
          taskState: taskStateIn,
          citations: mapCitations(
            searchKnowledge("compliance 价格 促销", 2),
          ),
          guardrail: { triggered: true, hits: ["价格/折扣或绝对化用语"] },
        }),
      );
    }

    if (intent === "brief_refine") {
      const citations = searchKnowledge(message, 5);
      const contextBlock =
        citations.length > 0
          ? formatContextForPrompt(citations)
          : "（未检索到补充片段，请基于现有 Brief 谨慎修订）";

      const rawReply = await chatCompletion(
        buildBriefRefineMessages({
          instruction: message,
          previousBrief,
          contextBlock,
        }),
      );
      const guard = scanCompliance(rawReply);
      let markdown = rawReply;
      if (guard.triggered && guard.suggestion) {
        markdown = `${rawReply}\n\n---\n**合规提示：** ${guard.suggestion}`;
      }

      const briefRevision = computeBriefDiff(previousBrief, markdown);
      const displayMarkdown = stripRevisionSummary(markdown);

      return res.status(200).json(
        basePayload({
          reply: `已根据你的指令更新 Brief。${briefRevision.summary}`,
          intent,
          taskState: "await_confirm",
          citations: mapCitations(citations),
          brief: { markdown: displayMarkdown },
          briefRevision,
          guardrail: guard,
        }),
      );
    }

    if (intent === "brief_create") {
      const aggregated = mergeHistoryForSlots(conversation, message);
      const slots = analyzeBriefSlotsFromText(aggregated);
      if (!slots.complete) {
        return res.status(200).json(
          basePayload({
            reply: "生成 Brief 前还需要一些信息：",
            intent,
            taskState: "clarifying",
            needClarification: true,
            clarificationQuestions: slots.clarificationQuestions,
            citations: [],
          }),
        );
      }

      const searchQuery = aggregated.slice(-800);
      const citations = searchKnowledge(searchQuery, 5);
      const contextBlock =
        citations.length > 0
          ? formatContextForPrompt(citations)
          : "（未检索到相关片段，请谨慎回答并提示知识库可能不完整）";

      const rawReply = await chatCompletion(
        buildBriefMessages({
          request: aggregated,
          contextBlock,
          history: conversation,
        }),
      );
      const guard = scanCompliance(rawReply);
      let markdown = rawReply;
      if (guard.triggered && guard.suggestion) {
        markdown = `${rawReply}\n\n---\n**合规提示：** ${guard.suggestion}`;
      }

      return res.status(200).json(
        basePayload({
          reply: guard.triggered
            ? "已生成 Brief 草案，请查看下方内容并注意合规提示。"
            : "已生成 Brief 草案，请确认后导出或继续提出修改。",
          intent,
          taskState: "await_confirm",
          citations: mapCitations(citations),
          brief: { markdown },
          guardrail: guard,
        }),
      );
    }

    const citations = searchKnowledge(message, 5);
    const contextBlock =
      citations.length > 0
        ? formatContextForPrompt(citations)
        : "（未检索到相关片段，请谨慎回答并提示知识库可能不完整）";

    const rawReply = await chatCompletion(
      buildQaMessages({
        query: message,
        contextBlock,
        history: conversation,
      }),
    );
    const guard = scanCompliance(rawReply);
    let reply = rawReply;
    if (guard.triggered && guard.suggestion) {
      reply = `${rawReply}\n\n---\n**合规提示：** ${guard.suggestion}`;
    }

    return res.status(200).json(
      basePayload({
        reply,
        intent: "knowledge_qa",
        taskState: "idle",
        citations: mapCitations(citations),
        guardrail: guard,
      }),
    );
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
