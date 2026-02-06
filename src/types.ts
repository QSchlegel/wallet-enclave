export type Chain = "bitcoin" | "cardano";

export type TxIntent = {
  chain: Chain;
  to: string;
  amount: string; // string for exactness
  asset?: string; // e.g. "BTC" | "ADA" | token id
  feePolicy?: {
    maxFee?: string;
    priority?: "low" | "normal" | "high";
  };
  metadata?: unknown; // cardano tx metadata
  idempotencyKey?: string;
};
