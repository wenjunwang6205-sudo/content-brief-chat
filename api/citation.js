import { getKnowledgeByDocId } from "../lib/knowledge.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const docId = req.query?.docId;
  if (!docId || typeof docId !== "string") {
    return res.status(400).json({ error: "docId is required" });
  }

  const doc = getKnowledgeByDocId(docId);
  if (!doc) {
    return res.status(404).json({ error: "not found" });
  }

  return res.status(200).json(doc);
}
