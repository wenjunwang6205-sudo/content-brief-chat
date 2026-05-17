# ContentBrief Chat — V2 产品升级 PRD（企业助手能力层）

| 字段 | 内容 |
|------|------|
| 版本 | Product v2.0 |
| 前置 | UI V1 ✅ · API `/api/chat` ✅ · Vercel + Pages ✅ |
| 目标 | 从「能聊的 Demo」升级为「可演示企业助手闭环」：意图路由 → 任务状态机 → 跨轮修订 → 会话恢复 → 任务成功率可观测 |
| 参考范式 | 企业内部智能助手（知识问答 / 任务执行 / 人机协作 / 指标闭环） |
| 非目标 | SSO、真实 OA 集成、流式 SSE、后端会话数据库（V2 用 localStorage + 可选轻量 API） |

---

## 1. 背景

UI V1 已对齐 ChatGPT 浅色体验，并具备：

- 双模式（问答 / Brief）  
- RAG 引用、缺槽追问、Brief 导出、合规兜底  

V2 补齐企业助手 **「怎么听懂用户 → 怎么办完任务 → 怎么度量成功」** 三层，覆盖核心体验与增长闭环类产品的典型能力要求。

---

## 2. V2 核心链路（目标架构）

```
用户输入
  → [1] 意图识别 Intent（规则 + 可选 LLM 二次判断）
  → [2] 路由 Router → Handler
        ├─ knowledge_qa   → RAG + 引用回答
        ├─ brief_task     → 任务状态机 + Brief Agent
        ├─ brief_refine   → 在已有 Brief 上修订（跨轮）
        ├─ chitchat       → 能力说明（固定话术）
        ├─ policy_block   → 越权/合规拒答
        └─ handoff_human  → 转人工提示（演示话术）
  → [3] 多轮任务状态机 Task FSM（Brief 域）
  → [4] 会话持久化 Session（localStorage，可恢复）
  → [5] 观测 Events → 任务成功率等指标
```

---

## 3. 意图体系（Intent Taxonomy）

| intent | 触发示例 | Handler | 成功判定 |
|--------|----------|---------|----------|
| `knowledge_qa` | 品牌调性？小红书标题规范？ | RAG QA | 有引用且用户未重复追问 |
| `brief_create` | 写 618 抖音 Brief… | Brief FSM 从 clarifying/drafting | 用户点击「标记任务完成」 |
| `brief_refine` | 把人群改成 Z 世代 | 基于 `pendingBrief` 修订 | 修订后确认/完成 |
| `chitchat` | 你能做什么？ | 固定能力卡片 | 用户继续有效提问 |
| `policy_block` | 全网最低价写进 Brief | 规则拒答 + compliance | 无幻觉输出 |
| `handoff_human` | 找人工 / 转工单 | 固定话术 + 指引 | 记录 `handoff` 事件 |

### 3.1 识别策略（V2 实现）

**分层，避免一上来端到端黑盒：**

1. **规则层（P0）**  
   - 正则 / 关键词：Brief、活动、种草、导出 → `brief_*`  
   - 修订：「改」「换成」「调整」+ 存在 `pendingBrief` → `brief_refine`  
   - 人工：人工、客服、工单 → `handoff_human`  
   - 合规：价格、最低价、第一、最好 → `policy_block`（可与现有 guard 合并）  
   - 能力：你能做什么 → `chitchat`  
   - 默认：`knowledge_qa`（当前 mode=qa 时）或跟随 UI 模式  

2. **置信度（P1）**  
   - 规则命中 ≥2 条冲突 → 返回 `need_intent_confirm` + 芯片让用户选  

3. **LLM 分类（P2，可选）**  
   - 仅低置信度时调用小 prompt，输出 JSON `{ intent, confidence }`  

### 3.2 前端展示（P1）

助手首条回复前展示轻量标签：**「识别为：Brief 任务 · 修订」**（可关闭），体现产品感。

---

## 4. Brief 任务状态机（Task FSM）

```
                    ┌─────────────┐
                    │    idle     │
                    └──────┬──────┘
                           │ 用户发起 Brief
                           ▼
                    ┌─────────────┐
              ┌────│ clarifying  │◄──── 缺槽追问
              │    └──────┬──────┘
              │           │ 槽位齐
              │           ▼
              │    ┌─────────────┐
              │    │  drafting   │──► 生成 Brief
              │    └──────┬──────┘
              │           │
              │           ▼
              │    ┌─────────────┐
              └────│  refining   │◄── brief_refine 跨轮
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │await_confirm│── 用户可继续 refine
                   └──────┬──────┘
                          │ 确认导出 / 标记完成
                          ▼
                   ┌─────────────┐
                   │  completed  │
                   └─────────────┘
```

| 状态 | 用户可见 | 系统行为 |
|------|----------|----------|
| `clarifying` | 追问列表 | 不生成完整 Brief |
| `drafting` | Loading | 调 LLM 生成 Brief |
| `refining` | 「正在根据你的修改更新 Brief…」 | 带 `previousBrief` 调 LLM |
| `await_confirm` | Artifact 卡片 + 导出 + **标记任务完成** | 等待用户确认 |
| `completed` | 摘要「任务已完成」+ 禁用重复完成 | 打点 `task_completed` |

---

## 5. 跨轮改 Brief（brief_refine）

### 5.1 场景

用户已在 `await_confirm` 或 `refining`，输入：

> 「把目标人群改成 Z 世代」  
> 「渠道只用小红书」

### 5.2 请求扩展

`POST /api/chat` 增加字段：

```json
{
  "mode": "brief",
  "message": "把人群改成Z世代",
  "sessionId": "uuid",
  "taskId": "uuid",
  "taskState": "await_confirm",
  "previousBrief": "# markdown ...",
  "history": []
}
```

### 5.3 响应

- `intent: "brief_refine"`  
- `taskState: "await_confirm"`  
- `brief.markdown`：修订后全文  
- `reply`：简短说明改了什么  

### 5.4 Prompt 要点

- 输入：旧 Brief + 用户修改指令 + 知识库片段  
- 约束：仅改相关章节，保留未提及部分；仍禁止编造价格  

---

## 6. 会话恢复（Session Recovery）

### 6.1 V2 范围（localStorage）

| 存储键 | 内容 |
|--------|------|
| `cbc_session_id` | UUID |
| `cbc_messages` | 消息列表 JSON |
| `cbc_mode` | qa \| brief |
| `cbc_task_state` | FSM 状态 |
| `cbc_pending_brief` | 当前 Brief markdown |
| `cbc_task_id` | 当前任务 ID |
| `cbc_updated_at` | 时间戳 |

### 6.2 体验

- 刷新 / 关闭浏览器再打开 → **恢复上次对话**（顶部提示「已恢复上次会话 · 新对话将清除」）  
- 点击「新对话」→ 清空 storage + 新 sessionId / taskId  

### 6.3 后续（V3，不写进 V2 必做）

- 服务端 `GET /api/session/:id`（需账号体系）  

---

## 7. 观测与指标（Analytics）

### 7.1 事件表（前端 + 可选 API 上报）

| event | 触发 | 属性 | 用途 |
|-------|------|------|------|
| `session_start` | 新会话 | sessionId | 活跃 |
| `session_resume` | 从 storage 恢复 | — | 留存代理 |
| `message_send` | 用户发送 | mode, intent | 互动 |
| `intent_detected` | 识别完成 | intent, confidence | 路由质量 |
| `task_started` | 进入 drafting | taskId | 任务漏斗 |
| `task_completed` | 用户点「标记任务完成」 | taskId, durationMs | **任务成功率** 分子 |
| `brief_exported` | 导出 md | taskId | 交付行为 |
| `citation_opened` | 打开 Drawer | docId | 信任 |
| `handoff_human` | 转人工话术展示 | — | 兜底率 |
| `guardrail_triggered` | 合规拦截 | hits | 质量 |

### 7.2 指标定义（产品与文档）

| 指标 | 公式（演示期） |
|------|----------------|
| **任务成功率** | `task_completed` / `task_started`（同 session 同 taskId） |
| **Brief 修订率** | 含 `brief_refine` 的 task / 总 Brief task |
| **一次完成率** | 未完成前仅 1 次 `task_started` 即 `task_completed` |
| **平均任务耗时** | `task_completed.durationMs` 均值 |

### 7.3 V2 实现

- `demo/src/lib/analytics.ts`：`track(event, props)` → `console.log` + 写入 `localStorage` 事件数组（调试页可查看）  
- 可选：`POST /api/event` 空实现存内存（演示埋点管线）  

---

## 8. API 变更摘要

### 8.1 `POST /api/chat` 请求（扩展）

| 字段 | 必填 | 说明 |
|------|------|------|
| `message` | Y | 用户输入 |
| `mode` | N | UI 模式，作兜底 |
| `sessionId` | N | 会话 ID |
| `taskId` | N | 任务 ID |
| `taskState` | N | FSM 当前状态 |
| `previousBrief` | N | refine 时传入 |
| `history` | N | 已有 |

### 8.2 响应（扩展）

| 字段 | 说明 |
|------|------|
| `intent` | 识别结果 |
| `taskState` | 下一状态 |
| `needIntentConfirm` | 是否让用户选意图 |
| `intentOptions` | 候选意图列表 |
| `reply` / `brief` / `citations` | 同 V1 |
| `taskCompleted` | 是否已进入 completed |

### 8.3 新增（可选 P2）

`POST /api/task/complete` — 仅打点与状态校验；或合并在 chat 内 `action: "complete"`。

---

## 9. 前端变更摘要

| 模块 | 变更 |
|------|------|
| `lib/session.ts` | 读写 localStorage、恢复/清除 |
| `lib/analytics.ts` | 事件埋点 |
| `lib/intent.ts` | 规则意图（前端预检，可选） |
| `components/TaskStatusBar.tsx` | 显示 FSM + intent 标签 |
| `components/BriefArtifact.tsx` | 增加「标记任务完成」 |
| `components/IntentConfirm.tsx` | 低置信度意图选择 |
| `App.tsx` | 串联 FSM、恢复、跨轮 refine |

---

## 10. 分阶段交付（V2）

| 子版本 | 范围 | 验收 |
|--------|------|------|
| **V2.0** | 意图规则 + 展示标签 + FSM 状态展示 + `task_completed` 埋点 | 能说出识别结果并完成打点 |
| **V2.1** | `brief_refine` API + 跨轮改 Brief | 「改人群」生效 |
| **V2.2** | localStorage 会话恢复 | 刷新后对话仍在 |
| **V2.3** | `analytics` 调试面板（仅 ?debug=1） | 可查看事件流 |

---

## 11. 验收标准（V2 Done）

- [ ] 用户说「改人群」且已有 Brief → 走 refine，非重新 clarifying  
- [ ] 刷新页面后会话恢复，Brief 仍在  
- [ ] 点击「标记任务完成」→ `task_completed` 事件，UI 进入 completed  
- [ ] 意图在 UI 或响应中可见（非黑盒）  
- [ ] README / 能力映射表更新企业助手能力  
- [ ] `npm run build` 通过，Pages 可演示完整路径  

---

## 12. 与企业智能助手能力要求对照

| 能力要求 | V2 对应 |
|----------|---------|
| 知识问答、信息检索 | `knowledge_qa` + RAG |
| 任务执行与自动化 | `brief_create` FSM + refine（自动化 V3） |
| 引用溯源、追问、兜底 | V1 已有 + `policy_block` / `handoff_human` |
| 从回答问题到完成任务 | FSM + **标记任务完成** |
| 指标体系 | `task_success_rate` 等事件定义 |
| AI builder | API 扩展 + 可观测 |

---

*执行清单见 [V2-checklist.md](./V2-checklist.md)*
