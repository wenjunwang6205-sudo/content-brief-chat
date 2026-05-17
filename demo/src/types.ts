export type ChatMode = "qa" | "brief";

export type Intent =
  | "knowledge_qa"
  | "brief_create"
  | "brief_refine"
  | "chitchat"
  | "policy_block"
  | "handoff_human";

export type TaskState =
  | "idle"
  | "clarifying"
  | "drafting"
  | "refining"
  | "await_confirm"
  | "completed";

export type Citation = {
  index?: number;
  docId: string;
  title: string;
  snippet: string;
  fullContent?: string;
};

export type BriefRevision = {
  summary: string;
  changedSections: string[];
  diffLines: Array<{
    type: "add" | "change";
    section: string;
    preview: string;
  }>;
};

export type Guardrail = {
  triggered: boolean;
  hits: string[];
  suggestion?: string | null;
};

export type ChatResponse = {
  reply: string;
  citations: Citation[];
  brief: { markdown: string } | null;
  briefRevision?: BriefRevision | null;
  needClarification: boolean;
  clarificationQuestions: string[];
  intent?: Intent;
  taskState?: TaskState;
  taskCompleted?: boolean;
  needIntentConfirm?: boolean;
  intentOptions?: string[];
  guardrail?: Guardrail;
  error?: string;
  hint?: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  briefMarkdown?: string;
  briefRevision?: BriefRevision | null;
  streaming?: boolean;
};
