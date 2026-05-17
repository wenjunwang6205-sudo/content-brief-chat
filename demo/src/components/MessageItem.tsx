import type { Citation, Message } from "../types";
import { MarkdownContent } from "./MarkdownContent";

type MessageItemProps = {
  message: Message;
  onCitationClick: (citation: Citation) => void;
};

export function MessageItem({ message, onCitationClick }: MessageItemProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end py-2">
        <div className="max-w-[85%] rounded-2xl bg-[var(--user-bubble)] px-4 py-2.5 text-[15px] leading-relaxed text-[var(--text-primary)]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="py-3">
      <MarkdownContent content={message.content} />
      {message.citations && message.citations.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
          {message.citations.map((c, i) => (
            <button
              key={`${c.docId}-${i}`}
              type="button"
              onClick={() => onCitationClick(c)}
              className="text-xs text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
            >
              来源 {i + 1} · {c.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
