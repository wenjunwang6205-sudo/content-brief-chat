import { useCallback, useState } from "react";
import { sendChat } from "./api";
import { ChatThread } from "./components/ChatThread";
import { CitationDrawer } from "./components/CitationDrawer";
import { Composer } from "./components/Composer";
import { Header } from "./components/Header";
import type { ChatMode, Citation, Message } from "./types";

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function App() {
  const [mode, setMode] = useState<ChatMode>("qa");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingBrief, setPendingBrief] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const history = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setPendingBrief(null);
    setActiveCitation(null);
  };

  const handleModeChange = (next: ChatMode) => {
    setMode(next);
    handleNewChat();
  };

  const runSend = useCallback(
    async (text: string, sendMode: ChatMode = mode) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError(null);
      setLoading(true);
      const userMsg: Message = { id: uid(), role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      try {
        const res = await sendChat({
          mode: sendMode,
          message: trimmed,
          history: [...history, { role: "user", content: trimmed }],
        });

        const assistantContent = res.needClarification
          ? `${res.reply}\n\n${res.clarificationQuestions.map((q) => `• ${q}`).join("\n")}`
          : res.reply;

        const assistantMsg: Message = {
          id: uid(),
          role: "assistant",
          content: assistantContent,
          citations: res.citations,
          briefMarkdown: res.brief?.markdown,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (res.brief?.markdown) {
          setPendingBrief(res.brief.markdown);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "发送失败");
      } finally {
        setLoading(false);
      }
    },
    [history, loading, mode],
  );

  const exportBrief = () => {
    if (!pendingBrief) return;
    const blob = new Blob([pendingBrief], {
      type: "text/markdown;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "content-brief.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--bg-page)]">
      <Header mode={mode} onModeChange={handleModeChange} onNewChat={handleNewChat} />

      <ChatThread
        messages={messages}
        loading={loading}
        mode={mode}
        pendingBrief={pendingBrief}
        onPickSuggestion={(msg, m) => {
          setMode(m);
          void runSend(msg, m);
        }}
        onCitationClick={setActiveCitation}
        onExportBrief={exportBrief}
      />

      <Composer
        value={input}
        onChange={setInput}
        onSend={() => void runSend(input)}
        loading={loading}
        mode={mode}
        error={error}
      />

      <CitationDrawer
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
}
