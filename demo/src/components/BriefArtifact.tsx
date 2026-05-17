import type { TaskState } from "../types";
import { MarkdownContent } from "./MarkdownContent";

type BriefArtifactProps = {
  markdown: string;
  taskState: TaskState;
  onExport: () => void;
  onComplete: () => void;
};

export function BriefArtifact({
  markdown,
  taskState,
  onExport,
  onComplete,
}: BriefArtifactProps) {
  const done = taskState === "completed";

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--bg-page)] px-4 py-2.5">
        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)]">交付物</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            活动 Content Brief 草案
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExport}
            disabled={done}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-page)] disabled:opacity-50"
          >
            确认并导出
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={done}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {done ? "任务已完成" : "标记任务完成"}
          </button>
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto px-4 py-3">
        <MarkdownContent content={markdown} />
      </div>
    </div>
  );
}
