/**
 * @param {Array<{ role: string, content: string }> | undefined} history
 * @param {string} message
 * @param {number} maxMessages
 */
export function normalizeHistory(history, message, maxMessages = 20) {
  const list = Array.isArray(history)
    ? history.filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim(),
      )
    : [];

  const last = list[list.length - 1];
  if (!last || last.role !== "user" || last.content.trim() !== message.trim()) {
    list.push({ role: "user", content: message.trim() });
  }

  return list.slice(-maxMessages);
}

/**
 * @param {Array<{ role: string, content: string }>} history
 */
export function aggregateUserText(history) {
  return history
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim())
    .join("\n");
}

/**
 * @param {Array<{ role: string, content: string }>} history
 * @param {string} message
 */
export function mergeHistoryForSlots(history, message) {
  const normalized = normalizeHistory(history, message);
  return aggregateUserText(normalized);
}
