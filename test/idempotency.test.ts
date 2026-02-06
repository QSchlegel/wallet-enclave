import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { lookupIdempotency, storeIdempotency } from "../src/idempotency/idempotency.js";

test("idempotency store roundtrip", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "we-idempo-"));
  storeIdempotency(dir, { key: "k1", createdAt: new Date().toISOString(), chain: "bitcoin", txid: "t1" });
  const rec = lookupIdempotency(dir, "k1");
  assert.ok(rec);
  assert.equal(rec.txid, "t1");
});
