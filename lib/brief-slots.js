export function analyzeBriefSlots(message) {
  const hasCampaign = /活动|campaign|618|双11|春节|上市|种草|大促/i.test(message);
  const hasProduct =
    /电解质|无糖茶|气泡|SKU|产品|饮料|乌龙|青柠|白桃/.test(message);
  const hasGoal = /曝光|转化|种草|品牌|销量|认知|目标/.test(message);

  const missing = [];
  if (!hasCampaign) missing.push("活动名称或场景（如：618 抖音种草）");
  if (!hasProduct) missing.push("主推产品（如：电解质饮料-青柠）");
  if (!hasGoal) missing.push("活动目标（如：提升曝光 / 强化场景认知）");

  return {
    complete: missing.length === 0,
    clarificationQuestions: missing.slice(0, 2).map((m) => `请补充：${m}`),
  };
}
