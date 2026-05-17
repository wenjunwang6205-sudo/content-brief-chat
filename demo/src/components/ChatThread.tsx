import { useEffect, useRef } from "react";
import type { BriefRevision, Citation, Message, TaskState } from "../types";
import { BriefArtifact } from "./BriefArtifact";
import { EmptyState } from "./EmptyState";
import { MessageItem } from "./MessageItem";

type ChatThreadProps = {
  messages: Message[];
  loading: boolean;
  pendingBrief: string | null;
  briefRevision?: BriefRevision | null;
  taskState: TaskState;
  onPickSuggestion: (message: string) => void;
  onCitationClick: (citation: Citation) => void;
  onExportBrief: () => void;
  onCompleteTask: () => void;
};

export function ChatThread({
  messages,
  loading,
  pendingBrief,
  briefRevision,
  taskState,
  onPickSuggestion,
  onCitationClick,
  onExportBrief,
  onCompleteTask,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pendingBrief]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-4">
        {messages.length === 0 && !loading ? (
          <EmptyState onPick={onPickSuggestion} />
        ) : (
          <>
            {messages.map((m) => (
              <MessageItem
                key={m.id}
                message={m}
                onCitationClick={onCitationClick}
              />
            ))}
            {loading && !messages.some((m) => m.streaming) ? (
              <div className="flex gap-1 py-4" aria-label="正在生成">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-secondary)] [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-secondary)] [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-secondary)]" />
              </div>
            ) : null}
            {pendingBrief ? (
              <BriefArtifact
                markdown={pendingBrief}
                taskState={taskState}
                briefRevision={briefRevision}
                onExport={onExportBrief}
                onComplete={onCompleteTask}
              />
            ) : null}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
