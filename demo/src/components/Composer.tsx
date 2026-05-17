import { useCallback, useRef, type KeyboardEvent } from "react";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  mode: "qa" | "brief";
  error: string | null;
};

export function Composer({
  value,
  onChange,
  onSend,
  loading,
  mode,
  error,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) onSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-page)] px-4 py-4">
      <div className="mx-auto w-full max-w-3xl">
        {error ? (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        ) : null}

        <div className="relative flex items-end rounded-[26px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.06)]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              resize();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "qa" ? "询问品牌、渠道或合规问题…" : "描述活动 Brief 需求…"
            }
            rows={1}
            disabled={loading}
            className="max-h-40 min-h-[52px] flex-1 resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] disabled:opacity-60"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={loading || !value.trim()}
            aria-label="发送"
            className="m-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition hover:opacity-90 disabled:bg-[#d1d5db] disabled:text-[#9ca3af]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-[var(--text-secondary)]">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
