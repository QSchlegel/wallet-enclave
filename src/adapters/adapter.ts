import { Chain, TxIntent } from "../v1/schema.js";

export type BalanceLine = { asset: string; amount: string };

export interface ChainAdapter {
  chain: Chain;
  getAddress(): Promise<string>;
  getBalance(): Promise<BalanceLine[]>;
  buildTx(intent: TxIntent): Promise<{ unsignedTx: string; fee?: string }>;
  signTx(unsignedTx: string): Promise<{ signedTx: string }>;
  submitTx(signedTx: string): Promise<{ txid: string }>;
}
