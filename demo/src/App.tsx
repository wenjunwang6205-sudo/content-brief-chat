import { useCallback, useMemo, useState } from "react";
import { sendChat } from "./api";
import type { ChatMode, Citation, Message } from "./types";

const DEMO_SCRIPTS: Record<ChatMode, string> = {
  qa: "澄澈饮力品牌调性是什么？小红书标题有什么建议？",
  brief:
    "为618电解质饮料做抖音种草Brief，主推青柠电解质，目标提升曝光，人群是运动青年。",
};

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

  const history = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    [messages],
  );

  const runSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError(null);
      setLoading(true);
      const userMsg: Message = { id: uid(), role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      try {
        const res = await sendChat({
          mode,
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
    const blob = new Blob([pendingBrief], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "content-brief.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-700/80 bg-slate-900/60 backdrop-blur px-4 py-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400/90">
              Enterprise Assistant Demo
            </p>
            <h1 className="text-xl font-semibold text-white">ContentBrief Chat</h1>
            <p className="text-sm text-slate-400 mt-1">
              饮料快消 · 内容团队 · 知识问答与活动 Brief 任务闭环
            </p>
          </div>
          <div className="flex gap-2">
            {(["qa", "brief"] as ChatMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setMessages([]);
                  setPendingBrief(null);
                  setError(null);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  mode === m
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {m === "qa" ? "知识问答" : "Brief 任务"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:px-8 flex flex-col gap-4 min-h-0">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            className="text-cyan-400/90 hover:text-cyan-300 underline-offset-2 hover:underline"
            onClick={() => setInput(DEMO_SCRIPTS[mode])}
          >
            填入演示问题
          </button>
          <span className="text-slate-600">|</span>
          <a
            href="https://github.com/wenjunwang6205-sudo/content-brief-chat"
            className="text-slate-500 hover:text-slate-300"
            target="_blank"
            rel="noreferrer"
          >
            文档与 PRD
          </a>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 min-h-[320px] max-h-[50vh]">
          {messages.length === 0 && (
            <p className="text-slate-500 text-sm">
              {mode === "qa"
                ? "询问品牌调性、渠道规范、合规要求等，回答将附带引用来源。"
                : "描述活动与产品信息，系统将生成结构化 Brief，确认后可导出。"}
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-cyan-600/90 text-white"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                {m.content}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.citations.map((c) => (
                      <button
                        key={c.docId}
                        type="button"
                        onClick={() => setActiveCitation(c)}
                        className="text-xs px-2 py-1 rounded-md bg-slate-950/50 border border-slate-600 text-cyan-300 hover:border-cyan-500"
                      >
                        {c.docId}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <p className="text-slate-500 text-sm animate-pulse">思考中…</p>
          )}
        </div>

        {pendingBrief && mode === "brief" && (
          <section className="rounded-xl border border-cyan-800/50 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-cyan-400">Brief 预览（待确认）</h2>
              <button
                type="button"
                onClick={exportBrief}
                className="text-sm px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-medium hover:bg-cyan-400"
              >
                确认并导出 Markdown
              </button>
            </div>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {pendingBrief}
            </pre>
          </section>
        )}

        {error && (
          <p className="text-sm text-amber-400 bg-amber-950/40 border border-amber-800/50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void runSend(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "qa" ? "输入问题…" : "描述活动 Brief 需求…"}
            className="flex-1 rounded-xl bg-slate-800 border border-slate-600 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-medium disabled:opacity-40 hover:bg-cyan-400"
          >
            发送
          </button>
        </form>
      </main>

      {activeCitation && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          role="dialog"
          onClick={() => setActiveCitation(null)}
        >
          <div
            className="max-w-lg w-full rounded-xl bg-slate-900 border border-slate-600 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-cyan-400 text-sm font-mono">{activeCitation.docId}</h3>
            <p className="text-white font-medium mt-1">{activeCitation.title}</p>
            <p className="text-slate-400 text-sm mt-3">{activeCitation.snippet}</p>
            <button
              type="button"
              className="mt-4 text-sm text-slate-400 hover:text-white"
              onClick={() => setActiveCitation(null)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
