import type { Intent, TaskState } from "../types";

export const INTENT_LABELS: Record<Intent, string> = {
  knowledge_qa: "知识问答",
  brief_create: "Brief 任务",
  brief_refine: "Brief 修订",
  chitchat: "能力说明",
  policy_block: "合规拦截",
  handoff_human: "转人工",
};

export const TASK_STATE_LABELS: Record<TaskState, string> = {
  idle: "空闲",
  clarifying: "补全信息",
  drafting: "生成中",
  refining: "修订中",
  await_confirm: "待确认",
  completed: "已完成",
};
