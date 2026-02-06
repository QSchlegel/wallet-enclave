import fs from "node:fs";
import path from "node:path";
import { TxIntent } from "../v1/schema.js";

export type Policy = {
  allowlist: Record<string, { label: string; chains: ("bitcoin" | "cardano")[] }>;
  caps: {
    perTx: Record<string, string>; // asset -> max amount
    perDay: Record<string, string>; // asset -> max amount
  };
  feeCaps?: Record<string, string>; // asset -> max fee
};

export const DEFAULT_POLICY: Policy = {
  allowlist: {},
  caps: { perTx: {}, perDay: {} },
};

export function loadPolicy(dataDir: string): Policy {
  const p = path.join(dataDir, "policy.json");
  if (!fs.existsSync(p)) return DEFAULT_POLICY;
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw) as Policy;
}

export type PolicyDecision = { ok: true } | { ok: false; code: string; message: string };

export function checkTxIntent(policy: Policy, intent: TxIntent): PolicyDecision {
  // Destination allowlist
  const allowed = policy.allowlist[intent.to];
  if (!allowed) {
    return {
      ok: false,
      code: "DESTINATION_NOT_ALLOWLISTED",
      message: `Destination not allowlisted: ${intent.to}`,
    };
  }
  if (!allowed.chains.includes(intent.chain)) {
    return {
      ok: false,
      code: "DESTINATION_CHAIN_MISMATCH",
      message: `Destination allowlisted but not for chain ${intent.chain}`,
    };
  }

  // Caps (simple numeric compare; replace with exact decimals later)
  const asset = intent.asset ?? (intent.chain === "bitcoin" ? "BTC" : "ADA");
  const amt = Number(intent.amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return { ok: false, code: "INVALID_AMOUNT", message: "Amount must be a positive number string" };
  }

  const perTxCap = policy.caps.perTx[asset];
  if (perTxCap && amt > Number(perTxCap)) {
    return { ok: false, code: "CAP_PER_TX", message: `Amount exceeds per-tx cap for ${asset}` };
  }

  // Per-day cap needs accounting; MVP: enforce if configured but currently unknown spend.
  const perDayCap = policy.caps.perDay[asset];
  if (perDayCap) {
    return {
      ok: false,
      code: "CAP_PER_DAY_REQUIRES_ACCOUNTING",
      message: "Per-day cap configured but daily accounting not implemented yet",
    };
  }

  // Fee cap check would happen against quote; placeholder.
  return { ok: true };
}
