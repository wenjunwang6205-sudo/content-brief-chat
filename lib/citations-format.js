const FULL_MAX = 6000;

/**
 * @param {Array<{ docId: string, title: string, snippet: string, fullContent?: string }>} citations
 */
export function formatCitationsForClient(citations) {
  return citations.map((c, i) => ({
    index: i + 1,
    docId: c.docId,
    title: c.title,
    snippet: c.snippet,
    fullContent: (c.fullContent ?? c.snippet ?? "").slice(0, FULL_MAX),
  }));
}
