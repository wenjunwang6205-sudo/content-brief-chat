import type { BriefRevision, ChatMode, Message, TaskState } from "../types";

const STORAGE_KEY = "cbc_session_v2";

export type SessionSnapshot = {
  sessionId: string;
  taskId: string;
  mode: ChatMode;
  messages: Message[];
  pendingBrief: string | null;
  briefRevision?: BriefRevision | null;
  taskState: TaskState;
  savedAt: string;
};

export function createSessionIds() {
  const suffix = Math.random().toString(36).slice(2, 10);
  return {
    sessionId: `sess_${suffix}`,
    taskId: `task_${suffix}`,
  };
}

export function loadSession(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionSnapshot;
    if (!data.sessionId || !Array.isArray(data.messages)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveSession(snapshot: SessionSnapshot) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() }),
    );
  } catch {
    /* quota or private mode */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
