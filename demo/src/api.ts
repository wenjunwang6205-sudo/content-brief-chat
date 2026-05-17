import type { ChatMode, ChatResponse, TaskState } from "./types";

const API_BASE = (
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ||
  (import.meta.env.PROD ? "https://content-brief-chat.vercel.app" : "")
).replace(/\/$/, "");

function chatUrl() {
  return API_BASE ? `${API_BASE}/api/chat` : "/api/chat";
}

function streamUrl() {
  return API_BASE ? `${API_BASE}/api/chat-stream` : "/api/chat-stream";
}

type SendParams = {
  mode: ChatMode;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  sessionId: string;
  taskId: string;
  taskState: TaskState;
  previousBrief?: string | null;
};

async function parseJsonResponse(res: Response) {
  const data = (await res.json()) as ChatResponse & { retryAfterSec?: number };
  if (res.status === 429) {
    throw new Error(`请求过于频繁，请 ${data.retryAfterSec ?? 60} 秒后重试`);
  }
  if (!res.ok) {
    throw new Error(data.error ?? data.hint ?? `请求失败 (${res.status})`);
  }
  return data;
}

export async function sendChat(params: SendParams): Promise<ChatResponse> {
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
  return parseJsonResponse(res);
}

export type StreamCallbacks = {
  onMeta?: (data: { citations: ChatResponse["citations"] }) => void;
  onDelta: (text: string) => void;
  onDone: (data: ChatResponse) => void;
  onError: (err: Error) => void;
};

export async function sendChatStream(
  params: SendParams,
  callbacks: StreamCallbacks,
): Promise<void> {
  const res = await fetch(streamUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: params.mode,
      message: params.message,
      sessionId: params.sessionId,
      taskId: params.taskId,
      taskState: params.taskState,
      history: params.history,
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ChatResponse & {
      retryAfterSec?: number;
    };
    if (res.status === 429) {
      callbacks.onError(
        new Error(`请求过于频繁，请 ${data.retryAfterSec ?? 60} 秒后重试`),
      );
      return;
    }
    if (data.error === "stream_not_supported") {
      const fallback = await sendChat(params);
      callbacks.onDone(fallback);
      return;
    }
    callbacks.onError(
      new Error(data.error ?? data.hint ?? `请求失败 (${res.status})`),
    );
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error("无法读取流式响应"));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  const flushEvent = (block: string) => {
    const lines = block.split("\n");
    let event = "message";
    let dataLine = "";
    for (const line of lines) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) dataLine += line.slice(5).trim();
    }
    if (!dataLine) return;
    try {
      const data = JSON.parse(dataLine);
      if (event === "meta") callbacks.onMeta?.(data);
      if (event === "delta") callbacks.onDelta(data.text ?? "");
      if (event === "done") callbacks.onDone(data as ChatResponse);
      if (event === "error") {
        callbacks.onError(new Error(data.message ?? "stream error"));
      }
    } catch {
      /* ignore */
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) flushEvent(part);
  }
  if (buffer.trim()) flushEvent(buffer);
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
  return parseJsonResponse(res);
}
