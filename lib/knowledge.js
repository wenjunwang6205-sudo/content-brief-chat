import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_ROOT = path.join(__dirname, "..", "knowledge");

let cache = null;

function walkMdFiles(dir, base = "") {
  const entries = [];
  if (!fs.existsSync(dir)) return entries;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    const rel = path.join(base, name.name).replace(/\\/g, "/");
    if (name.isDirectory()) {
      entries.push(...walkMdFiles(full, rel));
    } else if (name.name.endsWith(".md")) {
      entries.push({ full, rel });
    }
  }
  return entries;
}

function loadChunks() {
  if (cache) return cache;
  const chunks = [];

  for (const { full, rel } of walkMdFiles(KNOWLEDGE_ROOT)) {
    if (rel === "README.md") continue;
    const raw = fs.readFileSync(full, "utf-8");
    const docIdMatch = raw.match(/\*\*doc_id:\*\*\s*`([^`]+)`/);
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const docId = docIdMatch?.[1] ?? rel.replace(/\.md$/, "").replace(/\\/g, "/");
    const title = titleMatch?.[1] ?? docId;
    chunks.push({
      docId,
      title,
      content: raw,
      category: docId.split("/")[0] ?? "misc",
    });
  }

  const catalogPath = path.join(KNOWLEDGE_ROOT, "product", "catalog.json");
  if (fs.existsSync(catalogPath)) {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
    for (const sku of catalog.skus ?? []) {
      chunks.push({
        docId: sku.id,
        title: sku.name,
        content: JSON.stringify(sku, null, 2),
        category: "product",
      });
    }
  }

  cache = chunks;
  return chunks;
}

function tokenize(text) {
  const normalized = text.toLowerCase();
  const segments = normalized.match(/[\u4e00-\u9fff]+|[a-z0-9]+/g) ?? [];
  const tokens = new Set();
  for (const seg of segments) {
    tokens.add(seg);
    // 中文长句拆成双字 gram，避免整句无法命中知识库关键词
    if (/^[\u4e00-\u9fff]+$/.test(seg) && seg.length > 2) {
      for (let i = 0; i < seg.length - 1; i++) {
        tokens.add(seg.slice(i, i + 2));
      }
    }
  }
  return [...tokens];
}

export function searchKnowledge(query, topK = 4) {
  const chunks = loadChunks();
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored = chunks
    .map((chunk) => {
      const hay = `${chunk.title} ${chunk.content}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (hay.includes(t)) score += 1;
      }
      if (chunk.category === "compliance" && /合规|广告|第一|最好|最低/.test(query)) {
        score += 2;
      }
      if (
        chunk.category === "brand" &&
        /调性|品牌|澄澈/.test(query)
      ) {
        score += 2;
      }
      return { chunk, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ chunk }) => ({
    docId: chunk.docId,
    title: chunk.title,
    snippet: chunk.content.slice(0, 280).replace(/\n+/g, " "),
    fullContent: chunk.content,
  }));
}

export function getKnowledgeByDocId(docId) {
  const chunks = loadChunks();
  const hit = chunks.find((c) => c.docId === docId);
  if (!hit) return null;
  return {
    docId: hit.docId,
    title: hit.title,
    fullContent: hit.content,
    snippet: hit.content.slice(0, 280).replace(/\n+/g, " "),
  };
}

export function formatContextForPrompt(citations) {
  return citations
    .map(
      (c, i) =>
        `[${i + 1}] doc_id=${c.docId}\n标题: ${c.title}\n${c.fullContent ?? c.snippet}`,
    )
    .join("\n\n---\n\n");
}
