const FORBIDDEN = [
  "第一",
  "最好",
  "最佳",
  "最低",
  "全网最低",
  "顶级",
  "唯一",
  "100%",
  "根治",
  "国家级",
];

const PRICE_PATTERNS = [
  /\d+(\.\d+)?\s*元/,
  /¥\s*\d+/,
  /折扣\s*\d/,
  /全网最低/,
];

export function scanCompliance(text) {
  const hits = FORBIDDEN.filter((w) => text.includes(w));
  const priceHit = PRICE_PATTERNS.some((p) => p.test(text));
  if (priceHit) hits.push("未授权价格/折扣表述");
  return {
    triggered: hits.length > 0,
    hits: [...new Set(hits)],
    suggestion:
      hits.length > 0
        ? "检测到可能违规表述，请改用客观描述并删除绝对化用语与未经确认的价格信息。"
        : null,
  };
}

export function looksLikePriceQuestion(message) {
  return /多少钱|价格|最低价|折扣|批发价|双十一.*价/.test(message);
}
