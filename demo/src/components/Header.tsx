type HeaderProps = {
  onNewChat: () => void;
};

export function Header({ onNewChat }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center border-b border-[var(--border)] bg-[var(--bg-surface)] px-4">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold text-[var(--text-primary)]">
            ContentBrief Chat
          </h1>
          <p className="truncate text-xs text-[var(--text-secondary)]">
            内容团队助手 · 单入口 · 自动识别意图
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="hidden h-9 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-page)] sm:inline-flex sm:items-center"
          >
            新对话
          </button>

          <a
            href="https://github.com/wenjunwang6205-sudo/content-brief-chat/tree/main/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-page)]"
          >
            文档
          </a>
        </div>
      </div>
    </header>
  );
}
