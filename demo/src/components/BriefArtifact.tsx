import { MarkdownContent } from "./MarkdownContent";

type BriefArtifactProps = {
  markdown: string;
  onExport: () => void;
};

export function BriefArtifact({ markdown, onExport }: BriefArtifactProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-page)] px-4 py-2.5">
        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)]">交付物</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">活动 Content Brief 草案</p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          确认并导出
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto px-4 py-3">
        <MarkdownContent content={markdown} />
      </div>
    </div>
  );
}
