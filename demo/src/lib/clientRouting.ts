import type { ChatMode, TaskState } from "../types";

function isWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

/** 前端是否走流式（仅知识问答类） */
export function shouldUseStream(params: {
  message: string;
  pendingBrief: string | null;
  taskState: TaskState;
}): boolean {
  // 微信内置浏览器对 SSE 不稳定，统一走非流式
  if (isWeChatBrowser()) return false;
  if (params.pendingBrief) return false;
  if (
    params.taskState !== "idle" &&
    params.taskState !== "completed"
  ) {
    return false;
  }
  if (
    /brief|活动|种草|投放|618|双11|春节|大促|生成|撰写|起草/i.test(
      params.message,
    )
  ) {
    return false;
  }
  return true;
}

/** API 弱提示：意图识别以服务端为准 */
export function apiModeHint(
  message: string,
  pendingBrief: string | null,
): ChatMode {
  if (
    pendingBrief ||
    /brief|活动|种草|投放|生成|撰写|起草/i.test(message)
  ) {
    return "brief";
  }
  return "qa";
}
