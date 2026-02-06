import crypto from "node:crypto";

// MVP: derive key from process secret + context. Replace with HSM / dedicated KMS.
function masterSecret(): Buffer {
  const s = process.env.WALLET_ENCLAVE_MASTER_SECRET;
  if (!s) {
    // Deliberately fail closed if crypto endpoints are used without a secret.
    throw new Error("WALLET_ENCLAVE_MASTER_SECRET not set");
  }
  return Buffer.from(s, "utf-8");
}

export function deriveKey(context: string): Buffer {
  const salt = Buffer.from("wallet-enclave-hkdf-salt", "utf-8");
  return Buffer.from(crypto.hkdfSync("sha256", masterSecret(), salt, Buffer.from(context, "utf-8"), 32));
}

export function encrypt(context: string, plaintextB64: string) {
  const key = deriveKey(context);
  const nonce = crypto.randomBytes(12);
  const pt = Buffer.from(plaintextB64, "base64");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  const ct = Buffer.concat([cipher.update(pt), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store as ct||tag
  const out = Buffer.concat([ct, tag]);
  return {
    alg: "AES-256-GCM" as const,
    ciphertextB64: out.toString("base64"),
    nonceB64: nonce.toString("base64"),
  };
}

export function decrypt(context: string, ciphertextB64: string, nonceB64: string) {
  const key = deriveKey(context);
  const nonce = Buffer.from(nonceB64, "base64");
  const buf = Buffer.from(ciphertextB64, "base64");
  const ct = buf.subarray(0, buf.length - 16);
  const tag = buf.subarray(buf.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return {
    alg: "AES-256-GCM" as const,
    plaintextB64: pt.toString("base64"),
  };
}
