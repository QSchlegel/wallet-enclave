import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import {
  AddrRequestSchema,
  BalanceRequestSchema,
  BuildTxRequestSchema,
  DecryptRequestSchema,
  EncryptRequestSchema,
  SignTxRequestSchema,
  SubmitTxRequestSchema,
} from "./schema.js";
import { adapterFor } from "../adapters/index.js";
import { appendAuditJsonl } from "../audit/audit_log.js";
import { checkTxIntent, loadPolicy } from "../policy/policy.js";
import { decrypt, encrypt } from "../crypto/crypto.js";
import { lookupIdempotency, storeIdempotency } from "../idempotency/idempotency.js";

function reqId(req: Request): string {
  const h = req.header("x-request-id");
  return h && h.length > 0 ? h : crypto.randomUUID();
}

function dataDir(): string {
  return process.env.WALLET_ENCLAVE_DATA_DIR || "/tmp/wallet-enclave";
}

function sendError(res: Response, requestId: string, code: string, message: string, details?: unknown) {
  res.status(400).json({ error: { code, message, details, requestId } });
}

export function registerV1(app: Express) {
  app.post("/v1/addr", async (req, res) => {
    const requestId = reqId(req);
    const parsed = AddrRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, requestId, "BAD_REQUEST", "Invalid body", parsed.error.flatten());

    const adapter = adapterFor(parsed.data.chain);
    const address = await adapter.getAddress();
    appendAuditJsonl(dataDir(), { ts: new Date().toISOString(), requestId, endpoint: "/v1/addr", decision: "allow" });
    res.json({ chain: parsed.data.chain, address });
  });

  app.post("/v1/balance", async (req, res) => {
    const requestId = reqId(req);
    const parsed = BalanceRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, requestId, "BAD_REQUEST", "Invalid body", parsed.error.flatten());

    const adapter = adapterFor(parsed.data.chain);
    const balances = await adapter.getBalance();
    appendAuditJsonl(dataDir(), { ts: new Date().toISOString(), requestId, endpoint: "/v1/balance", decision: "allow" });
    res.json({ chain: parsed.data.chain, balances });
  });

  app.post("/v1/tx/build", async (req, res) => {
    const requestId = reqId(req);
    const parsed = BuildTxRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, requestId, "BAD_REQUEST", "Invalid body", parsed.error.flatten());

    const policy = loadPolicy(dataDir());
    const decision = checkTxIntent(policy, parsed.data.intent);
    if (!decision.ok) {
      appendAuditJsonl(dataDir(), {
        ts: new Date().toISOString(),
        requestId,
        endpoint: "/v1/tx/build",
        decision: "deny",
        reason: decision.code,
      });
      return sendError(res, requestId, decision.code, decision.message);
    }

    const adapter = adapterFor(parsed.data.intent.chain);
    const built = await adapter.buildTx(parsed.data.intent);

    appendAuditJsonl(dataDir(), {
      ts: new Date().toISOString(),
      requestId,
      endpoint: "/v1/tx/build",
      decision: "allow",
      meta: { chain: parsed.data.intent.chain },
    });

    res.json({
      intent: parsed.data.intent,
      unsignedTx: built.unsignedTx,
      quote: { fee: built.fee, estimatedAt: new Date().toISOString() },
    });
  });

  app.post("/v1/tx/sign", async (req, res) => {
    const requestId = reqId(req);
    const parsed = SignTxRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, requestId, "BAD_REQUEST", "Invalid body", parsed.error.flatten());

    const adapter = adapterFor(parsed.data.chain);
    const out = await adapter.signTx(parsed.data.unsignedTx);
    appendAuditJsonl(dataDir(), { ts: new Date().toISOString(), requestId, endpoint: "/v1/tx/sign", decision: "allow" });
    res.json({ chain: parsed.data.chain, signedTx: out.signedTx });
  });

  app.post("/v1/tx/submit", async (req, res) => {
    const requestId = reqId(req);
    const parsed = SubmitTxRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, requestId, "BAD_REQUEST", "Invalid body", parsed.error.flatten());

    const existing = lookupIdempotency(dataDir(), parsed.data.idempotencyKey);
    if (existing) {
      appendAuditJsonl(dataDir(), {
        ts: new Date().toISOString(),
        requestId,
        endpoint: "/v1/tx/submit",
        decision: "allow",
        reason: "IDEMPOTENCY_HIT",
      });
      return res.json({ chain: parsed.data.chain, txid: existing.txid, status: "duplicate" as const });
    }

    const adapter = adapterFor(parsed.data.chain);
    const out = await adapter.submitTx(parsed.data.signedTx);
    storeIdempotency(dataDir(), {
      key: parsed.data.idempotencyKey,
      createdAt: new Date().toISOString(),
      chain: parsed.data.chain,
      txid: out.txid,
    });

    appendAuditJsonl(dataDir(), {
      ts: new Date().toISOString(),
      requestId,
      endpoint: "/v1/tx/submit",
      decision: "allow",
      meta: { txid: out.txid },
    });

    res.json({ chain: parsed.data.chain, txid: out.txid, status: "submitted" as const });
  });

  app.post("/v1/crypto/encrypt", (req, res) => {
    const requestId = reqId(req);
    const parsed = EncryptRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, requestId, "BAD_REQUEST", "Invalid body", parsed.error.flatten());

    try {
      const out = encrypt(parsed.data.context, parsed.data.plaintextB64);
      appendAuditJsonl(dataDir(), { ts: new Date().toISOString(), requestId, endpoint: "/v1/crypto/encrypt", decision: "allow" });
      res.json({ context: parsed.data.context, ...out });
    } catch (e) {
      appendAuditJsonl(dataDir(), {
        ts: new Date().toISOString(),
        requestId,
        endpoint: "/v1/crypto/encrypt",
        decision: "deny",
        error: { code: "CRYPTO_DISABLED", message: String(e) },
      });
      sendError(res, requestId, "CRYPTO_DISABLED", "Crypto endpoints require WALLET_ENCLAVE_MASTER_SECRET");
    }
  });

  app.post("/v1/crypto/decrypt", (req, res) => {
    const requestId = reqId(req);
    const parsed = DecryptRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, requestId, "BAD_REQUEST", "Invalid body", parsed.error.flatten());

    try {
      const out = decrypt(parsed.data.context, parsed.data.ciphertextB64, parsed.data.nonceB64);
      appendAuditJsonl(dataDir(), { ts: new Date().toISOString(), requestId, endpoint: "/v1/crypto/decrypt", decision: "allow" });
      res.json({ context: parsed.data.context, ...out });
    } catch (e) {
      appendAuditJsonl(dataDir(), {
        ts: new Date().toISOString(),
        requestId,
        endpoint: "/v1/crypto/decrypt",
        decision: "deny",
        error: { code: "CRYPTO_FAILED", message: String(e) },
      });
      sendError(res, requestId, "CRYPTO_FAILED", "Decrypt failed");
    }
  });
}
