import { INTENT_LABELS, TASK_STATE_LABELS } from "../lib/taskLabels";
import type { Intent, TaskState } from "../types";

type TaskStatusBarProps = {
  intent?: Intent | null;
  taskState: TaskState;
};

export function TaskStatusBar({ intent, taskState }: TaskStatusBarProps) {
  if (!intent && taskState === "idle") return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-xs">
      {intent ? (
        <span className="rounded-full bg-[var(--bg-page)] px-2.5 py-1 font-medium text-[var(--text-secondary)]">
          意图 · {INTENT_LABELS[intent]}
        </span>
      ) : null}
      <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-1 font-medium text-[var(--accent)]">
        任务 · {TASK_STATE_LABELS[taskState]}
      </span>
    </div>
  );
}
