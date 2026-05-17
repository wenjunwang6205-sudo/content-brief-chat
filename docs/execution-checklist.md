# ContentBrief Chat — 项目执行清单

> 与 [PRD.md](./PRD.md)、[testing.md](./testing.md) 配套使用。  
> 勾选状态：`[ ]` 未开始 · `[~]` 进行中 · `[x]` 完成

---

## 0. 项目约定（已对齐）

| 项 | 决策 |
|----|------|
| 产品名 | **ContentBrief Chat** |
| 场景 | 快消 · **饮料**（虚构品牌「澄澈饮力」） |
| 部署 | 前端 GitHub Pages + API **Vercel** |
| 公网安全 | **无 DEMO_TOKEN**；IP 限流 + token 上限 + 预算告警 |
| 知识库 | **单一 RAG 库**（不按面试公司拆分） |
| 披露 | 文档与代码中**不出现任何真实企业名称** |

---

## 1. 仓库与协作

| # | 任务 | 负责人 | 状态 |
|---|------|--------|------|
| 1.1 | 创建 GitHub 仓库 `content-brief-chat` 并推送 | — | [x] |
| 1.2 | README：项目说明、文档索引、架构示意 | — | [x] |
| 1.3 | 三份核心文档：PRD / 本清单 / testing | — | [x] |
| 1.4 | 在作品集站点增加本项目卡片与链接 | portfolio page.tsx | [x] |
| 1.5 | LICENSE（MIT） | — | [x] |

---

## 2. 需求与产品文档（M0）

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 2.1 | PRD v0.2 含分阶段交付 | docs/PRD.md | [x] |
| 2.2 | 产品大图定稿（含 V0 切口标注） | PRD §3 | [x] |
| 2.3 | 用户旅程图（文字版） | PRD §2 + 下表 | [x] |
| 2.4 | 内容质量评测维度 + 2 badcase | testing.md §4–5 | [x] |
| 2.5 | 指标与北极星定义 | PRD §8 | [x] |

### 用户旅程（文字版，供评审）

```
进入首页 → 选择模式（问答 / Brief）
  → 问答：提问 → 检索 → 回答+引用 → 可继续追问
  → Brief：描述活动 →（缺槽位则追问）→ 生成预览 → 用户修改/确认 → 导出 Markdown
→ 结束或切换模式
```

---

## 3. 知识库与评测资产（M1）

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 3.1 | 创建 `knowledge/brand/` 品牌调性（≥1 篇） | markdown | [x] |
| 3.2 | 创建 `knowledge/product/` 饮料 SKU（≥3 个虚构 SKU） | json/md | [x] |
| 3.3 | 创建 `knowledge/channel/` 小红书+抖音规范 | markdown | [x] |
| 3.4 | 创建 `knowledge/compliance/` 禁用词与广告法摘要 | markdown | [x] |
| 3.5 | 创建 `knowledge/cases/` 优质 Brief 样例（≥1） | markdown | [x] |
| 3.6 | 创建 `eval/badcases/` 两个 badcase 原始记录 | json/md | [x] |
| 3.7 | 创建 `eval/golden-samples/` 可选金标准 Brief | markdown | [x] |
| 3.8 | 知识库 doc_id 命名规范文档 | knowledge/README | [x] |

---

## 4. 后端 — Vercel API（M2）

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 4.1 | 初始化 `api/` 目录（Vercel 约定） | 项目结构 | [x] |
| 4.2 | 实现 `POST /api/chat` 接口契约 | api/chat.js | [x] |
| 4.3 | 接入 LLM（OpenAI 兼容） | 环境变量 | [~] 需你在 Vercel 配置 |
| 4.4 | 实现 RAG 检索 V0（关键词/top-k） | lib/knowledge.js | [x] |
| 4.5 | 实现 citations 结构与返回 | JSON schema | [x] |
| 4.6 | Brief 模式：槽位检测 + 模板输出 | lib/brief-slots.js | [x] |
| 4.7 | IP 限流中间件 | lib/rate-limit.js | [x] |
| 4.8 | 配置 Vercel 环境变量（Key/Base URL） | Vercel Dashboard | [ ] 需你操作 |
| 4.9 | 部署预览 URL，CORS 允许 Pages 域名 | vercel.json | [x] |
| 4.10 | 本地 `.env.example`（无真实 Key） | 根目录 + demo | [x] |

---

## 5. 前端 Demo（M3）

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 5.1 | 初始化 `demo/`（Vite + React + TS + Tailwind） | 工程 | [x] |
| 5.2 | 首页：产品说明 + 模式切换 | 页面 | [x] |
| 5.3 | 对话 UI + 引用卡片 | 组件 | [x] |
| 5.4 | Brief 预览区 + 确认导出 | 组件 | [x] |
| 5.5 | 失败兜底 UI（空状态/拒答） | error 展示 | [x] |
| 5.6 | 配置 `VITE_API_BASE` 指向 Vercel | demo/.env.example | [x] |
| 5.7 | GitHub Actions 部署 Pages | .github/workflows | [x] |
| 5.8 | 双模式演示脚本 | docs/demo-scripts.md | [x] |

---

## 6. 测试与质量（贯穿）

| # | 任务 | 参考 | 状态 |
|---|------|------|------|
| 6.1 | 编写并执行 P0 测试用例 | testing.md §2 | [ ] 待 API 部署后 |
| 6.2 | 跑通 2 个 badcase 回归 | testing.md §5 | [ ] |
| 6.3 | 内容评测抽样 3 次 Brief | testing.md §4 | [ ] |
| 6.4 | 公网冒烟：Pages → Vercel → LLM | testing.md §6 | [ ] |
| 6.5 | 录屏 2 分钟（问答 + Brief + 导出） | 文件/链接 | [ ] |

---

## 7. AI Builder 与交付材料

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 7.1 | Prompt 迭代记录（≥2 版对比） | docs/prompt-iteration.md | [x] |
| 7.2 | 架构图更新到 README | Mermaid | [x] |
| 7.3 | 作业/作品集用 PDF（从 docs 导出，可选） | — | [ ] |
| 7.4 | 内推/面试用一句话 + 链接 | README | [x] |

---

## 8. 里程碑时间表（建议）

| 周 | 里程碑 | 关键交付 |
|----|--------|----------|
| W1 | M0 + M1 | 文档 ✅、知识库 ✅ |
| W2 | M2 | Vercel API 部署 + Key |
| W3 | M3 | Pages 上线、P0 测试 |
| W4 | M4 | 录屏、作品集 |

---

## 9. 完成定义（Definition of Done）

项目 V0 视为完成当且仅当：

1. GitHub 仓库含 **docs + knowledge + demo + Vercel API** ✅（代码齐，待你部署 API）  
2. 公网 Pages 可完成 **1 次问答 + 1 次 Brief 导出** — 待 4.8 + Pages Variable  
3. testing.md 中 **P0 用例全部通过**  
4. 无任何真实企业名称泄露 ✅  
5. API Key 未出现在 git 历史与前端 bundle ✅  

---

*最后更新：M1–M3 代码已完成，待 Vercel 与 Pages 变量配置*
