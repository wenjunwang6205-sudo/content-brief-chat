#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CASES_DIR = path.join(ROOT, "eval", "cases");

const API_BASE = (
  process.env.EVAL_API_BASE ?? "https://content-brief-chat.vercel.app"
).replace(/\/$/, "");

async function postChat(body) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

function loadCases() {
  return fs
    .readdirSync(CASES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), "utf-8")));
}

function assertCase(id, data, rules) {
  const errors = [];
  const reply = data.reply ?? "";

  if (rules.intent && data.intent !== rules.intent) {
    errors.push(`intent: expected ${rules.intent}, got ${data.intent}`);
  }
  if (rules.intentIn && !rules.intentIn.includes(data.intent)) {
    errors.push(`intent: expected one of ${rules.intentIn.join("|")}, got ${data.intent}`);
  }
  if (rules.needClarification === true && !data.needClarification) {
    errors.push("expected needClarification=true");
  }
  if (rules.needClarification === false && data.needClarification) {
    errors.push("expected needClarification=false");
  }
  if (rules.briefIsNull && data.brief) {
    errors.push("expected brief=null");
  }
  if (rules.briefNotNull && !data.brief?.markdown) {
    errors.push("expected brief.markdown");
  }
  if (rules.briefRevisionNotNull && !data.briefRevision) {
    errors.push("expected briefRevision");
  }
  if (rules.citationsMin != null && (data.citations?.length ?? 0) < rules.citationsMin) {
    errors.push(`citations < ${rules.citationsMin}`);
  }
  if (rules.guardrailTriggered && !data.guardrail?.triggered) {
    errors.push("expected guardrail.triggered");
  }
  for (const word of rules.replyNotContains ?? []) {
    if (reply.includes(word)) errors.push(`reply must not contain: ${word}`);
  }
  if (
    rules.replyContainsAny &&
    !rules.replyContainsAny.some((w) => reply.includes(w))
  ) {
    errors.push(`reply must contain one of: ${rules.replyContainsAny.join(", ")}`);
  }
  if (rules.replyContains && !reply.includes(rules.replyContains)) {
    errors.push(`reply must contain: ${rules.replyContains}`);
  }

  return errors;
}

async function runSingle(caseDef) {
  const { status, data } = await postChat({
    ...caseDef.request,
    sessionId: "eval",
    taskId: `eval-${caseDef.id}`,
    history: caseDef.request.history ?? [],
  });

  if (status === 503) {
    return { id: caseDef.id, skipped: true, reason: "LLM not configured" };
  }
  if (status !== 200) {
    return { id: caseDef.id, ok: false, errors: [`HTTP ${status}: ${data.error}`] };
  }

  const errors = assertCase(caseDef.id, data, caseDef.assert ?? {});
  return { id: caseDef.id, ok: errors.length === 0, errors };
}

async function runMulti(caseDef) {
  let history = [];
  let lastData = null;
  for (const step of caseDef.steps) {
    const { status, data } = await postChat({
      ...step,
      sessionId: "eval",
      taskId: `eval-${caseDef.id}`,
      history,
    });
    if (status !== 200) {
      return { id: caseDef.id, ok: false, errors: [`HTTP ${status}`] };
    }
    history = [
      ...history,
      { role: "user", content: step.message },
      { role: "assistant", content: data.reply },
    ];
    lastData = data;
  }
  const errors = assertCase(caseDef.id, lastData, caseDef.assert ?? {});
  return { id: caseDef.id, ok: errors.length === 0, errors };
}

async function main() {
  console.log(`Eval API: ${API_BASE}\n`);
  const cases = loadCases();
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const c of cases) {
    const result = c.steps ? await runMulti(c) : await runSingle(c);
    if (result.skipped) {
      skipped++;
      console.log(`⊘ ${result.id} — ${result.reason}`);
      continue;
    }
    if (result.ok) {
      passed++;
      console.log(`✓ ${result.id}`);
    } else {
      failed++;
      console.log(`✗ ${result.id}`);
      for (const e of result.errors) console.log(`    ${e}`);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
