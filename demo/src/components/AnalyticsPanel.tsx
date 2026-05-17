import { useMemo } from "react";
import { getEvents, getTaskMetrics } from "../lib/analytics";

export function AnalyticsPanel() {
  const metrics = useMemo(() => getTaskMetrics(), []);
  const events = useMemo(() => getEvents().slice(-12).reverse(), []);

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-72 max-h-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg">
      <div className="border-b border-[var(--border)] bg-[var(--bg-page)] px-3 py-2">
        <p className="text-xs font-semibold text-[var(--text-primary)]">
          Analytics（debug）
        </p>
        <p className="text-[10px] text-[var(--text-secondary)]">
          任务成功率（本地）
        </p>
      </div>
      <div className="space-y-1 px-3 py-2 text-xs">
        <p>
          开始 {metrics.started} · 完成 {metrics.completed}
          {metrics.successRate !== null ? ` · ${metrics.successRate}%` : ""}
        </p>
        <ul className="max-h-32 overflow-y-auto text-[10px] text-[var(--text-secondary)]">
          {events.map((e, i) => (
            <li key={`${e.at}-${i}`} className="truncate">
              {e.name} · {new Date(e.at).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
