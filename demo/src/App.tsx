import { useCallback, useEffect, useRef, useState } from "react";
import { completeTask, sendChat } from "./api";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import { ChatThread } from "./components/ChatThread";
import { CitationDrawer } from "./components/CitationDrawer";
import { Composer } from "./components/Composer";
import { Header } from "./components/Header";
import { ResumeBanner } from "./components/ResumeBanner";
import { TaskStatusBar } from "./components/TaskStatusBar";
import { isDebugMode, track } from "./lib/analytics";
import {
  clearSession,
  createSessionIds,
  loadSession,
  saveSession,
} from "./lib/session";
import type { ChatMode, Citation, Intent, Message, TaskState } from "./types";

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
  const [taskState, setTaskState] = useState<TaskState>("idle");
  const [lastIntent, setLastIntent] = useState<Intent | null>(null);
  const initialIds = useRef(createSessionIds());
  const [sessionId, setSessionId] = useState(initialIds.current.sessionId);
  const [taskId, setTaskId] = useState(initialIds.current.taskId);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const taskStartedRef = useRef(false);
  const hydratedRef = useRef(false);

  const history = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.messages.length > 0) {
      setMode(saved.mode);
      setMessages(saved.messages);
      setPendingBrief(saved.pendingBrief);
      setTaskState(saved.taskState);
      setSessionId(saved.sessionId);
      setTaskId(saved.taskId);
      setShowResumeBanner(true);
      track("session_resume", {
        sessionId: saved.sessionId,
        messageCount: saved.messages.length,
      });
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    saveSession({
      sessionId,
      taskId,
      mode,
      messages,
      pendingBrief,
      taskState,
      savedAt: new Date().toISOString(),
    });
  }, [sessionId, taskId, mode, messages, pendingBrief, taskState]);

  const resetSession = useCallback(() => {
    const ids = createSessionIds();
    setSessionId(ids.sessionId);
    setTaskId(ids.taskId);
    setMessages([]);
    setInput("");
    setError(null);
    setPendingBrief(null);
    setActiveCitation(null);
    setTaskState("idle");
    setLastIntent(null);
    setShowResumeBanner(false);
    taskStartedRef.current = false;
    clearSession();
    track("session_new", { sessionId: ids.sessionId });
  }, []);

  const handleNewChat = () => {
    resetSession();
  };

  const handleModeChange = (next: ChatMode) => {
    setMode(next);
    handleNewChat();
  };

  const maybeStartTask = (intent?: Intent) => {
    if (
      taskStartedRef.current ||
      !intent ||
      (intent !== "brief_create" && intent !== "brief_refine")
    ) {
      return;
    }
    taskStartedRef.current = true;
    track("task_started", { taskId, sessionId, intent });
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

      if (sendMode === "brief" && taskState === "idle") {
        setTaskState("clarifying");
      }

      try {
        const res = await sendChat({
          mode: sendMode,
          message: trimmed,
          history: [...history, { role: "user", content: trimmed }],
          sessionId,
          taskId,
          taskState,
          previousBrief: pendingBrief,
        });

        if (res.intent) setLastIntent(res.intent);
        if (res.taskState) setTaskState(res.taskState);
        maybeStartTask(res.intent);

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
        if (res.taskCompleted) {
          track("task_completed", { taskId, sessionId });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "发送失败");
      } finally {
        setLoading(false);
      }
    },
    [history, loading, mode, pendingBrief, sessionId, taskId, taskState],
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
    track("brief_exported", { taskId, sessionId });
  };

  const handleCompleteTask = async () => {
    if (taskState === "completed") return;
    setLoading(true);
    setError(null);
    try {
      const res = await completeTask({ sessionId, taskId });
      setTaskState("completed");
      if (res.intent) setLastIntent(res.intent);
      track("task_completed", { taskId, sessionId });
      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        content: res.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "标记失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--bg-page)]">
      <Header mode={mode} onModeChange={handleModeChange} onNewChat={handleNewChat} />

      {showResumeBanner ? (
        <ResumeBanner onDismiss={() => setShowResumeBanner(false)} />
      ) : null}

      <TaskStatusBar intent={lastIntent} taskState={taskState} />

      <ChatThread
        messages={messages}
        loading={loading}
        mode={mode}
        pendingBrief={pendingBrief}
        taskState={taskState}
        onPickSuggestion={(msg, m) => {
          setMode(m);
          void runSend(msg, m);
        }}
        onCitationClick={setActiveCitation}
        onExportBrief={exportBrief}
        onCompleteTask={() => void handleCompleteTask()}
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

      {isDebugMode() ? <AnalyticsPanel key={messages.length + taskState} /> : null}
    </div>
  );
}
