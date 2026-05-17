# ContentBrief Chat — UI V1 执行清单（浅色 ChatGPT 风）

> 需求详见 [UI-V1-PRD.md](./UI-V1-PRD.md)

勾选：`[x]` 完成

---

## 0. 准备

| # | 任务 | 状态 |
|---|------|------|
| 0.1 | UI-V1 PRD 评审 | [x] |
| 0.2 | 安装 `react-markdown` `remark-gfm` | [x] |

---

## 1. 设计 Token 与全局样式（P0）

| # | 任务 | 状态 |
|---|------|------|
| 1.1 | `index.css` 浅色 token + body 背景 | [x] |
| 1.2 | Markdown prose 基础样式 | [x] |

---

## 2. 组件拆分（P0）

| # | 任务 | 文件 | 状态 |
|---|------|------|------|
| 2.1 | Header + 模式下拉 + 新对话 | `components/Header.tsx` | [x] |
| 2.2 | 空状态 + 建议芯片 | `components/EmptyState.tsx` | [x] |
| 2.3 | Composer 吸底 | `components/Composer.tsx` | [x] |
| 2.4 | 消息行 User/Assistant | `components/MessageItem.tsx` | [x] |
| 2.5 | 对话列表 + 自动滚动 | `components/ChatThread.tsx` | [x] |
| 2.6 | App 编排 | `App.tsx` | [x] |

---

## 3. 体验增强（P1）

| # | 任务 | 状态 |
|---|------|------|
| 3.1 | Assistant Markdown 渲染 | [x] |
| 3.2 | 引用脚注 + CitationDrawer | [x] |
| 3.3 | BriefArtifact 卡片 + 导出 | [x] |
| 3.4 | Loading 三点占位 | [x] |

---

## 4. 构建与部署

| # | 任务 | 状态 |
|---|------|------|
| 4.1 | `npm run build` 通过 | [x] |
| 4.2 | push → GitHub Pages workflow | [~] 推送后自动 |
| 4.3 | 线上冒烟：问答 + Brief + 引用 + 导出 | [ ] 待你验证 |

---

## 5. 文档

| # | 任务 | 状态 |
|---|------|------|
| 5.1 | README 增加 UI V1 说明 | [x] |
| 5.2 | 本清单全部勾选 | [x] |

---

*UI V1 已完成开发，待 GitHub Pages 部署后线上验收*
