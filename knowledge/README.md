# 知识库说明

## doc_id 命名规范

格式：`{category}/{slug}`

| 前缀 | 目录 | 示例 |
|------|------|------|
| `brand/` | brand/ | `brand/voice-guide` |
| `product/` | product/ | `product/sku-electrolyte` |
| `channel/` | channel/ | `channel/xiaohongshu` |
| `compliance/` | compliance/ | `compliance/ad-law` |
| `cases/` | cases/ | `cases/spring-2025-brief` |

## 维护原则

- 事实类内容（SKU、成分）仅写在 `product/`
- 渠道规则写在 `channel/`，不与 brand 重复
- 禁用词与广告法仅写在 `compliance/`
- 每次修改记录版本日期于文首 frontmatter（可选）
