import type { ChatMode, ChatResponse } from "./types";

// 生产构建默认走 Vercel API；可用 VITE_API_BASE 覆盖。本地 dev 留空走 vite proxy。
const API_BASE = (
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ||
  (import.meta.env.PROD ? "https://content-brief-chat.vercel.app" : "")
).replace(/\/$/, "");

export async function sendChat(params: {
  mode: ChatMode;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<ChatResponse> {
  const url = API_BASE ? `${API_BASE}/api/chat` : "/api/chat";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: params.mode,
      message: params.message,
      sessionId: "demo",
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
