# ContentBrief Chat — V2 执行清单（企业助手能力层）

> 需求详见 [V2-PRD.md](./V2-PRD.md)  
> 前置：UI V1 ✅ · `/api/chat` ✅

勾选：`[ ]` 未开始 · `[~]` 进行中 · `[x]` 完成

---

## 0. 文档

| # | 任务 | 状态 |
|---|------|------|
| 0.1 | V2 PRD | [x] |
| 0.2 | V2 本清单 | [x] |
| 0.3 | README 增加 V2 说明与能力映射链接 | [x] |

---

## V2.0 — 意图路由 + FSM 展示 + 任务完成

### API（`api/` + `lib/`）

| # | 任务 | 状态 |
|---|------|------|
| 0.1 | `lib/intent.js` 规则识别（6 类 intent） | [x] |
| 0.2 | `api/chat.js` 返回 `intent` / `taskState` | [x] |
| 0.3 | `chitchat` / `handoff_human` 固定话术分支 | [x] |
| 0.4 | 请求体支持 `taskState` / `sessionId` / `taskId` | [x] |

### 前端

| # | 任务 | 状态 |
|---|------|------|
| 0.5 | `lib/analytics.ts` + 核心事件 | [x] |
| 0.6 | `components/TaskStatusBar.tsx`（intent + FSM） | [x] |
| 0.7 | BriefArtifact 增加「标记任务完成」按钮 | [x] |
| 0.8 | `task_started` / `task_completed` 埋点 | [x] |
| 0.9 | `types.ts` 扩展 ChatResponse | [x] |

---

## V2.1 — 跨轮改 Brief（brief_refine）

| # | 任务 | 状态 |
|---|------|------|
| 1.1 | `lib/prompts.js` 增加 `buildBriefRefineMessages` | [x] |
| 1.2 | API：`previousBrief` + refine 分支 | [x] |
| 1.3 | FSM：`refining` → `await_confirm` | [x] |
| 1.4 | 前端：传 `pendingBrief`，展示修订说明 | [x] |
| 1.5 | 测试：「把人群改成 Z 世代」 | [ ] 需联调 LLM |

---

## V2.2 — 会话恢复（localStorage）

| # | 任务 | 状态 |
|---|------|------|
| 2.1 | `lib/session.ts` save/load/clear | [x] |
| 2.2 | App 启动时 `session_resume` | [x] |
| 2.3 | 顶部 Banner「已恢复上次会话」 | [x] |
| 2.4 | 新对话清空 storage | [x] |
| 2.5 | 测试：刷新后消息 + Brief 仍在 | [ ] 手动验收 |

---

## V2.3 — 可观测（调试）

| # | 任务 | 状态 |
|---|------|------|
| 3.1 | 事件写入 `localStorage` 队列 | [x] |
| 3.2 | `?debug=1` 打开 Analytics 面板 | [x] |
| 3.3 | 展示任务成功率（本地计算） | [x] |
| 3.4 | （可选）`POST /api/event` stub | [x] |

---

## V2.x — 可选增强

| # | 任务 | 状态 |
|---|------|------|
| x.1 | 低置信度 `IntentConfirm` 芯片 | [ ] |
| x.2 | LLM 意图分类兜底 | [ ] |
| x.3 | 流式 SSE 输出 | [ ] |

---

## 部署与验收

| # | 任务 | 状态 |
|---|------|------|
| d.1 | `npm run build` | [x] |
| d.2 | `vercel --prod` | [ ] 需本地执行 |
| d.3 | GitHub Pages workflow | [ ] push 后自动 |
| d.4 | 走通 testing.md 补充用例（V2 节） | [ ] |
| d.5 | 录屏 3min：恢复会话 → refine → 标记完成 | [ ] |

---

## 建议实施顺序（单线程）

```
V2.0（1–2 天）→ V2.1（1 天）→ V2.2（0.5 天）→ V2.3（0.5 天）→ 部署验收
```

---

*完成后更新 [execution-checklist.md](./execution-checklist.md) 注明 V2*
