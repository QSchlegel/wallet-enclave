import test from "node:test";
import assert from "node:assert/strict";

test("encrypt/decrypt roundtrip", async () => {
  process.env.WALLET_ENCLAVE_MASTER_SECRET = "dev-secret";
  const { encrypt, decrypt } = await import("../src/crypto/crypto.js");
  const pt = Buffer.from("hello", "utf-8").toString("base64");
  const enc = encrypt("ctx", pt);
  const dec = decrypt("ctx", enc.ciphertextB64, enc.nonceB64);
  assert.equal(Buffer.from(dec.plaintextB64, "base64").toString("utf-8"), "hello");
});
