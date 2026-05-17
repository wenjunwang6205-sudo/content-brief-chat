export type ChatMode = "qa" | "brief";

export type Citation = {
  docId: string;
  title: string;
  snippet: string;
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
  needClarification: boolean;
  clarificationQuestions: string[];
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
};
