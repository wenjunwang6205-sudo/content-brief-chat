import { looksLikePriceQuestion } from "./guardrail.js";

/** @typedef {'knowledge_qa'|'brief_create'|'brief_refine'|'chitchat'|'policy_block'|'handoff_human'} Intent */

const REFINE_RE = /改|换成|调整|修改|改为|改成|替换|更新/;
const BRIEF_RE =
  /brief|活动|种草|投放|方案|大促|618|双11|春节|上市|策划/;
const BRIEF_VERB_RE = /写|生成|做|出|撰写|起草/;

/**
 * @param {{ message: string, mode: 'qa'|'brief', hasPreviousBrief: boolean, taskState?: string }} ctx
 */
export function detectIntent(ctx) {
  const { message, mode, hasPreviousBrief, taskState } = ctx;
  const text = message.trim();

  if (/人工|客服|工单|找人|转人工/.test(text)) {
    return { intent: /** @type {Intent} */ ("handoff_human"), confidence: 1 };
  }
  if (/你能做什么|你能干什么|怎么用|帮助|你是谁/.test(text)) {
    return { intent: "chitchat", confidence: 1 };
  }
  if (looksLikePriceQuestion(text) || /第一|最好|最低|全网最低/.test(text)) {
    return { intent: "policy_block", confidence: 0.95 };
  }

  if (
    hasPreviousBrief &&
    REFINE_RE.test(text) &&
    taskState !== "completed" &&
    taskState !== "idle"
  ) {
    return { intent: "brief_refine", confidence: 0.92 };
  }

  if (
    mode === "brief" ||
    (BRIEF_RE.test(text) && BRIEF_VERB_RE.test(text)) ||
    (mode === "brief" && BRIEF_RE.test(text))
  ) {
    return { intent: "brief_create", confidence: 0.85 };
  }

  return { intent: "knowledge_qa", confidence: 0.8 };
}

export const INTENT_LABELS = {
  knowledge_qa: "知识问答",
  brief_create: "Brief 任务",
  brief_refine: "Brief 修订",
  chitchat: "能力说明",
  policy_block: "合规拦截",
  handoff_human: "转人工",
};
