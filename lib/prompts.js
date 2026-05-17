/**
 * @param {Array<{ role: 'user'|'assistant', content: string }>} history
 * @param {string} query
 * @param {string} contextBlock
 */
export function buildQaMessages({ history = [], query, contextBlock }) {
  const system = {
    role: "system",
    content: `你是「澄澈饮力」饮料品牌的内容团队助手。仅依据【知识库】回答；无依据则明确说知识库中没有，不要编造价格、折扣、功效。
回答简洁，使用 Markdown。在正文中用 [1](cite:1)、[2](cite:2) 标注引用（编号与知识库片段序号一致）。
文末可另附「参考来源」列表。`,
  };

  const prior = history.slice(0, -1).filter((m) => m.role === "user" || m.role === "assistant");
  const finalUser = {
    role: "user",
    content: `【知识库】\n${contextBlock}\n\n【问题】\n${query}`,
  };

  return [system, ...prior, finalUser];
}

export function buildBriefRefineMessages({
  instruction,
  previousBrief,
  contextBlock,
}) {
  return [
    {
      role: "system",
      content: `你是饮料品牌内容策划助手。根据用户的修改指令，在【现有 Brief】基础上修订。
输出必须为 Markdown，且**开头**先写章节「## 变更说明」（2–4 条 bullet，说明改了什么），再输出完整 Brief 正文（7 个业务章节，与新建 Brief 相同）。
保留未提及的章节内容；只修改相关部分。禁止绝对化用语与未经记载的价格。`,
    },
    {
      role: "user",
      content: `【知识库】\n${contextBlock}\n\n【现有 Brief】\n${previousBrief}\n\n【修改指令】\n${instruction}`,
    },
  ];
}

export function buildBriefMessages({ request, contextBlock, history = [] }) {
  const prior = history
    .slice(0, -1)
    .filter((m) => m.role === "user" || m.role === "assistant");
  const userContent = `【知识库】\n${contextBlock}\n\n【需求】\n${request}`;

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
    ...prior,
    { role: "user", content: userContent },
  ];
}
