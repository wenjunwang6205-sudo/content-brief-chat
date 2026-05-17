import { SUGGESTIONS } from "../constants";
import type { ChatMode } from "../types";

type EmptyStateProps = {
  mode: ChatMode;
  onPick: (message: string, mode: ChatMode) => void;
};

export function EmptyState({ mode, onPick }: EmptyStateProps) {
  void mode;
  const items = SUGGESTIONS;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface)] text-xl shadow-sm ring-1 ring-[var(--border)]">
        ✦
      </div>
      <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
        今天想完成什么？
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        {mode === "qa"
          ? "查询品牌调性、渠道规范与合规要求，回答将附带可溯源引用。"
          : "描述活动目标与产品信息，生成结构化 Content Brief，确认后可导出。"}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onPick(item.message, item.mode)}
            className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--bg-page)]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
