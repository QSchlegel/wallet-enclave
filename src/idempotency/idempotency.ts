import fs from "node:fs";
import path from "node:path";

export type IdempotencyRecord = {
  key: string;
  createdAt: string;
  chain: "bitcoin" | "cardano";
  txid: string;
};

function filePath(dataDir: string) {
  return path.join(dataDir, "idempotency.jsonl");
}

export function lookupIdempotency(dataDir: string, key: string): IdempotencyRecord | null {
  const fp = filePath(dataDir);
  if (!fs.existsSync(fp)) return null;
  const lines = fs.readFileSync(fp, "utf-8").split("\n").filter(Boolean);
  for (const line of lines.reverse()) {
    try {
      const rec = JSON.parse(line) as IdempotencyRecord;
      if (rec.key === key) return rec;
    } catch {
      // ignore
    }
  }
  return null;
}

export function storeIdempotency(dataDir: string, rec: IdempotencyRecord) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.appendFileSync(filePath(dataDir), JSON.stringify(rec) + "\n", "utf-8");
}
