const SECTION_RE = /^##\s+(.+)$/gm;

function parseSections(markdown) {
  /** @type {Map<string, string>} */
  const map = new Map();
  if (!markdown) return map;
  const parts = markdown.split(/\n(?=##\s+)/);
  for (const part of parts) {
    const m = part.match(/^##\s+(.+?)(?:\n|$)/);
    if (!m) continue;
    map.set(m[1].trim(), part.trim());
  }
  return map;
}

export function extractRevisionSummary(markdown) {
  const m = markdown.match(/##\s*变更说明\s*\n+([\s\S]*?)(?=\n##\s+|$)/);
  return m?.[1]?.trim() ?? null;
}

export function stripRevisionSummary(markdown) {
  return markdown
    .replace(/##\s*变更说明\s*\n+[\s\S]*?(?=\n##\s+|$)/, "")
    .trim();
}

/**
 * @param {string} previousBrief
 * @param {string} nextBrief
 */
export function computeBriefDiff(previousBrief, nextBrief) {
  const prev = parseSections(previousBrief);
  const next = parseSections(stripRevisionSummary(nextBrief));
  const changedSections = [];
  const diffLines = [];

  for (const [title, body] of next.entries()) {
    if (title === "变更说明") continue;
    const oldBody = prev.get(title);
    if (!oldBody) {
      changedSections.push(title);
      diffLines.push({ type: "add", section: title, preview: body.slice(0, 120) });
    } else if (oldBody.trim() !== body.trim()) {
      changedSections.push(title);
      diffLines.push({ type: "change", section: title, preview: body.slice(0, 120) });
    }
  }

  const summary =
    extractRevisionSummary(nextBrief) ??
    (changedSections.length > 0
      ? `已更新章节：${changedSections.join("、")}`
      : "已对 Brief 进行修订");

  return { summary, changedSections, diffLines };
}
