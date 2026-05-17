const QUEUE_KEY = "cbc_analytics_v1";

export type AnalyticsEvent = {
  name: string;
  props: Record<string, unknown>;
  at: string;
};

function readQueue(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnalyticsEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(events: AnalyticsEvent[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-200)));
  } catch {
    /* ignore */
  }
}

export function track(name: string, props: Record<string, unknown> = {}) {
  const entry: AnalyticsEvent = {
    name,
    props,
    at: new Date().toISOString(),
  };
  const next = [...readQueue(), entry];
  writeQueue(next);

  const apiBase = import.meta.env.VITE_API_BASE?.replace(/\/$/, "");
  if (apiBase) {
    void fetch(`${apiBase}/api/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, props }),
    }).catch(() => {});
  }
}

export function getEvents(): AnalyticsEvent[] {
  return readQueue();
}

export function getTaskMetrics() {
  const events = readQueue();
  const started = events.filter((e) => e.name === "task_started").length;
  const completed = events.filter((e) => e.name === "task_completed").length;
  const successRate =
    started > 0 ? Math.round((completed / started) * 100) : null;
  return { started, completed, successRate };
}

export function isDebugMode() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}
