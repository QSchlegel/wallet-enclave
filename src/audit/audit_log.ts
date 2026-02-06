import fs from "node:fs";
import path from "node:path";

export type AuditEvent = {
  ts: string;
  requestId: string;
  endpoint: string;
  decision: "allow" | "deny";
  reason?: string;
  meta?: unknown;
  error?: { code: string; message: string };
};

export function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export function appendAuditJsonl(dataDir: string, ev: AuditEvent) {
  ensureDir(dataDir);
  const file = path.join(dataDir, "audit.jsonl");
  fs.appendFileSync(file, JSON.stringify(ev) + "\n", { encoding: "utf-8" });
}
