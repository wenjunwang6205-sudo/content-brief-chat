import type { ChatMode } from "./types";

export const SUGGESTIONS: { mode: ChatMode; label: string; message: string }[] = [
  {
    mode: "qa",
    label: "品牌调性是什么？",
    message: "澄澈饮力品牌调性是什么？",
  },
  {
    mode: "qa",
    label: "小红书标题规范",
    message: "小红书标题有什么字数和建议？",
  },
  {
    mode: "brief",
    label: "生成 618 Brief",
    message:
      "为618电解质饮料做抖音种草Brief，主推青柠电解质，目标提升曝光，人群是运动青年。",
  },
];

export const MODE_LABELS: Record<ChatMode, string> = {
  qa: "知识问答",
  brief: "Brief 任务",
};
