import { z } from "zod";

export const ChainSchema = z.enum(["bitcoin", "cardano"]);
export type Chain = z.infer<typeof ChainSchema>;

export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.literal("wallet-enclave"),
  ts: z.string(),
});

export const AddrRequestSchema = z.object({
  chain: ChainSchema,
});
export const AddrResponseSchema = z.object({
  chain: ChainSchema,
  address: z.string(),
});

export const BalanceRequestSchema = z.object({
  chain: ChainSchema,
});
export const BalanceResponseSchema = z.object({
  chain: ChainSchema,
  // string amounts for exactness
  balances: z.array(
    z.object({
      asset: z.string(),
      amount: z.string(),
    })
  ),
});

export const TxIntentSchema = z.object({
  chain: ChainSchema,
  to: z.string(),
  amount: z.string(),
  asset: z.string().optional(),
  feePolicy: z
    .object({
      maxFee: z.string().optional(),
      priority: z.enum(["low", "normal", "high"]).optional(),
    })
    .optional(),
  metadata: z.unknown().optional(),
  idempotencyKey: z.string().min(1).optional(),
});
export type TxIntent = z.infer<typeof TxIntentSchema>;

export const BuildTxRequestSchema = z.object({
  intent: TxIntentSchema,
});
export const BuildTxResponseSchema = z.object({
  intent: TxIntentSchema,
  unsignedTx: z.string(), // opaque
  quote: z
    .object({
      fee: z.string().optional(),
      estimatedAt: z.string(),
    })
    .optional(),
});

export const SignTxRequestSchema = z.object({
  chain: ChainSchema,
  unsignedTx: z.string(),
});
export const SignTxResponseSchema = z.object({
  chain: ChainSchema,
  signedTx: z.string(),
});

export const SubmitTxRequestSchema = z.object({
  chain: ChainSchema,
  signedTx: z.string(),
  idempotencyKey: z.string().min(1),
});
export const SubmitTxResponseSchema = z.object({
  chain: ChainSchema,
  txid: z.string(),
  status: z.enum(["submitted", "duplicate"]),
});

export const EncryptRequestSchema = z.object({
  context: z.string().min(1),
  plaintextB64: z.string().min(1),
});
export const EncryptResponseSchema = z.object({
  context: z.string(),
  ciphertextB64: z.string(),
  nonceB64: z.string(),
  alg: z.literal("AES-256-GCM"),
});

export const DecryptRequestSchema = z.object({
  context: z.string().min(1),
  ciphertextB64: z.string().min(1),
  nonceB64: z.string().min(1),
});
export const DecryptResponseSchema = z.object({
  context: z.string(),
  plaintextB64: z.string(),
  alg: z.literal("AES-256-GCM"),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
