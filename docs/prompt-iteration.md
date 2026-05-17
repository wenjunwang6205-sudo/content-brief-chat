# Prompt 迭代记录

## v1 → v2（Brief 模式）

| 版本 | 策略 | 问题 |
|------|------|------|
| v1 | 单次生成自由 Markdown | 缺章节、易出绝对化用语 |
| v2 | 强制 7 章节模板 + compliance 检索加权 | 结构稳定，BC-02 明显减少 |

## v1 → v2（问答模式）

| 版本 | 策略 | 问题 |
|------|------|------|
| v1 | 仅 user 问题，无知识库 | 幻觉 SKU 与价格 |
| v2 | 注入 top-k 片段 + 文末要求 doc_id | 引用可追溯，BC-01 改拒答逻辑 |

## 工程侧修复（非 prompt）

- 价格类问题：规则拦截，不调用 LLM（`looksLikePriceQuestion`）
- Brief 缺槽位：规则追问，节省 token
- 输出后：`scanCompliance` 扫描极限词

## 工具

- 本地：`vercel dev` + Demo 页面
- 对比：同一问题 v1/v2 输出存档于 `eval/`
