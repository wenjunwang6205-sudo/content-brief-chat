import type { ChatMode, ChatResponse, TaskState } from "./types";

const API_BASE = (
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ||
  (import.meta.env.PROD ? "https://content-brief-chat.vercel.app" : "")
).replace(/\/$/, "");

function chatUrl() {
  return API_BASE ? `${API_BASE}/api/chat` : "/api/chat";
}

export async function sendChat(params: {
  mode: ChatMode;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  sessionId: string;
  taskId: string;
  taskState: TaskState;
  previousBrief?: string | null;
}): Promise<ChatResponse> {
  const res = await fetch(chatUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: params.mode,
      message: params.message,
      sessionId: params.sessionId,
      taskId: params.taskId,
      taskState: params.taskState,
      previousBrief: params.previousBrief ?? undefined,
      history: params.history,
    }),
  });

  const data = (await res.json()) as ChatResponse & { retryAfterSec?: number };

  if (res.status === 429) {
    throw new Error(`请求过于频繁，请 ${data.retryAfterSec ?? 60} 秒后重试`);
  }
  if (!res.ok) {
    throw new Error(data.error ?? data.hint ?? `请求失败 (${res.status})`);
  }
  return data;
}

export async function completeTask(params: {
  sessionId: string;
  taskId: string;
}): Promise<ChatResponse> {
  const res = await fetch(chatUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "complete_task",
      sessionId: params.sessionId,
      taskId: params.taskId,
    }),
  });

  const data = (await res.json()) as ChatResponse;
  if (!res.ok) {
    throw new Error(data.error ?? `请求失败 (${res.status})`);
  }
  return data;
}
