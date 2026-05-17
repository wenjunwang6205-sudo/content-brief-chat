import type { Citation } from "../types";

type CitationDrawerProps = {
  citation: Citation | null;
  onClose: () => void;
};

export function CitationDrawer({ citation, onClose }: CitationDrawerProps) {
  if (!citation) return null;

  return (
    <>
      <button
        type="button"
        aria-label="关闭"
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--bg-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">引用来源</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
          >
            关闭
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="font-mono text-xs text-[var(--text-secondary)]">{citation.docId}</p>
          <h4 className="mt-2 text-base font-medium text-[var(--text-primary)]">
            {citation.title}
          </h4>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            {citation.snippet}
          </p>
        </div>
      </aside>
    </>
  );
}
