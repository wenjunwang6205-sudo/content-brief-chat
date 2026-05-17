import { SUGGESTIONS } from "../constants";

type EmptyStateProps = {
  onPick: (message: string) => void;
};

export function EmptyState({ onPick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface)] text-xl shadow-sm ring-1 ring-[var(--border)]">
        ✦
      </div>
      <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
        今天想完成什么？
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        直接输入即可：查品牌/渠道/合规会自动引用知识库；描述活动需求会生成 Brief。无需切换模式。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onPick(item.message)}
            className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--bg-page)]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
