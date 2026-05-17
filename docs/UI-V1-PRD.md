# ContentBrief Chat — UI V1 升级 PRD（浅色 ChatGPT 风）

| 字段 | 内容 |
|------|------|
| 版本 | UI v1.0 |
| 依赖 | 产品 PRD v0.2、API Vercel + DeepSeek 已通 |
| 目标 | 将 Demo 从「工程样品」升级为「产品级对话壳」，对齐 ChatGPT 浅色体验范式 |
| 非目标 | 用户系统、会话持久化、流式 SSE、暗色主题切换 |

---

## 1. 背景与问题

当前 Demo 存在：

- 深色 + 青色强调，观感偏技术 Demo  
- 对话区嵌套小滚动框，不像主产品  
- 纯文本 / `pre` 展示，无 Markdown 排版  
- 引用以 `doc_id` 按钮呈现，认知成本高  
- Brief 堆在输入区下方，交付感弱  

V1 在 **不改变 API 契约** 前提下，仅升级前端体验。

---

## 2. 设计原则（对齐 ChatGPT 浅色）

| 原则 | 落地 |
|------|------|
| 单一阅读焦点 | 主对话区 `max-w-3xl` 水平居中 |
| 视觉降噪 | 背景 `#f7f7f8`，文字 `#0d0d0d` / 次要 `#6e6e80` |
| 少边框多留白 | 用背景块区分用户消息，不用重气泡描边 |
| 输入吸底 | 固定底部 Composer，圆角 + 轻阴影 |
| 助手即文档 | `react-markdown` 渲染回复与 Brief |
| 企业差异可见 | 引用脚注 + Brief Artifact 卡片 + 顶栏模式切换 |

---

## 3. 信息架构

```
┌────────────────────────────────────────────────────────┐
│ Header: Logo · 产品名 · [模式 ▾] · 新对话 · 文档链接      │
├────────────────────────────────────────────────────────┤
│                    ChatThread (居中)                    │
│  EmptyState | MessageList | BriefArtifact              │
├────────────────────────────────────────────────────────┤
│ Composer (吸底): textarea + 发送                        │
└────────────────────────────────────────────────────────┘
CitationDrawer (右侧滑出，点击引用打开)
```

---

## 4. 功能需求

### 4.1 Header（P0）

- 高度约 52px，白底 + 底部分割线 `#ececf1`  
- 左：产品名 **ContentBrief Chat** + 副标题「内容团队助手 · 演示」  
- 中/右：**模式下拉**（知识问答 / Brief 任务）  
- **新对话**：清空消息与 Brief 状态  
- **文档**：外链 GitHub `docs/PRD.md`  

### 4.2 空状态（P0）

- 无消息时：居中图标区 + 一句能力说明  
- **3 个建议芯片**（点击即发送）：  
  1. 品牌调性问答  
  2. 小红书规范问答  
  3. 618 Brief 示例  

### 4.3 消息列表（P0 + P1）

| 角色 | 样式 | 内容 |
|------|------|------|
| User | 浅灰底 `#f4f4f4` 圆角块，宽度 `fit-content`，右对齐 | 纯文本 |
| Assistant | 无气泡边框，左对齐全宽 | **Markdown 渲染** |
| Loading | 左对齐三点跳动占位 | — |

- 列表区域：占满 Header 与 Composer 之间，`overflow-y-auto`  
- 新消息后自动滚到底部  

### 4.4 引用（P1）

- 助手消息底部：**脚注式引用**「来源 1 · 品牌调性指南」  
- 点击打开 **右侧 Drawer**，展示 `docId` + `snippet`  
- 不再使用裸露 `doc_id` 按钮墙  

### 4.5 Brief Artifact（P1）

- Brief 模式生成后，在对话流末尾展示 **文档卡片**  
- 卡片含：标题「活动 Brief 草案」、Markdown 预览（限高可滚动）  
- 主按钮：**确认并导出 Markdown**  
- 与 ChatGPT Artifact / Canvas 心智一致  

### 4.6 Composer（P0）

- 吸底，`max-w-3xl` 居中  
- 多行 `textarea`，最小 1 行，最大约 6 行后内部滚动  
- **Enter** 发送，**Shift+Enter** 换行  
- 发送按钮：圆角方形 ↑，禁用态灰显  
- 加载中禁用输入  

### 4.7 错误提示（P0）

- 输入框上方细条浅红底提示，非大块 alert  

### 4.8 响应式（P0）

- 移动端：Drawer 全宽；Composer 全宽 padding  

---

## 5. 视觉 Token

| Token | 值 |
|-------|-----|
| `--bg-page` | `#f7f7f8` |
| `--bg-surface` | `#ffffff` |
| `--border` | `#ececf1` |
| `--text-primary` | `#0d0d0d` |
| `--text-secondary` | `#6e6e80` |
| `--user-bubble` | `#f4f4f4` |
| `--accent` | `#10a37f`（ChatGPT 绿，仅主按钮） |
| `--radius-lg` | `1rem` |

---

## 6. 技术方案

| 项 | 选型 |
|----|------|
| 框架 | 现有 Vite + React + TS + Tailwind v4 |
| Markdown | `react-markdown` + `remark-gfm` |
| 组件拆分 | `Header`, `ChatThread`, `MessageItem`, `Composer`, `CitationDrawer`, `BriefArtifact`, `EmptyState` |
| API | 不改 `demo/src/api.ts` 契约 |

---

## 7. 验收标准

- [ ] 浅色整体，无青色赛博风  
- [ ] 空状态 + 建议芯片可一键发问  
- [ ] 用户/助手消息布局符合 §4.3  
- [ ] 助手回复 Markdown 标题/列表正常  
- [ ] 引用可点开 Drawer  
- [ ] Brief 以卡片展示并可导出  
- [ ] Enter 发送 / Shift+Enter 换行  
- [ ] `npm run build` 通过  
- [ ] GitHub Pages 部署后视觉与本地一致  

---

## 8. 里程碑

| 阶段 | 内容 |
|------|------|
| UI-V1-P0 | 布局、浅色、Header、空状态、Composer、消息基础样式 |
| UI-V1-P1 | Markdown、引用 Drawer、Brief Artifact |
| UI-V1-P2 | 流式输出（后续，不在本次范围） |

---

*关联文档：[UI-V1-checklist.md](./UI-V1-checklist.md)*
