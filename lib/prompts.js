export function buildQaMessages({ query, contextBlock }) {
  return [
    {
      role: "system",
      content: `你是「澄澈饮力」饮料品牌的内容团队助手。仅依据【知识库】回答；无依据则明确说知识库中没有，不要编造价格、折扣、功效。
回答简洁，使用 Markdown。在文末列出「参考来源」并写上 doc_id。`,
    },
    {
      role: "user",
      content: `【知识库】\n${contextBlock}\n\n【问题】\n${query}`,
    },
  ];
}

export function buildBriefRefineMessages({
  instruction,
  previousBrief,
  contextBlock,
}) {
  return [
    {
      role: "system",
      content: `你是饮料品牌内容策划助手。根据用户的修改指令，在【现有 Brief】基础上修订，输出完整 Markdown Brief。
保留未提及的章节；只修改相关部分。禁止绝对化用语与未经记载的价格。
必须保留全部 7 个章节结构（与新建 Brief 相同）。`,
    },
    {
      role: "user",
      content: `【知识库】\n${contextBlock}\n\n【现有 Brief】\n${previousBrief}\n\n【修改指令】\n${instruction}`,
    },
  ];
}

export function buildBriefMessages({ request, contextBlock }) {
  return [
    {
      role: "system",
      content: `你是饮料品牌内容策划助手。根据知识库生成活动 Content Brief，输出为 Markdown，必须包含以下章节：
## 1. 活动背景与目标
## 2. 目标人群与洞察
## 3. 核心信息与卖点
## 4. 渠道与内容形式建议
## 5. 调性关键词与参考句式
## 6. 合规注意事项
## 7. 待确认项
禁止绝对化用语与未经记载的价格。核心卖点需能在知识库中找到依据。`,
    },
    {
      role: "user",
      content: `【知识库】\n${contextBlock}\n\n【需求】\n${request}`,
    },
  ];
}
