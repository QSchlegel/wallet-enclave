import crypto from "node:crypto";
import { ChainAdapter } from "./adapter.js";

export class StubBitcoinAdapter implements ChainAdapter {
  chain = "bitcoin" as const;

  async getAddress(): Promise<string> {
    return "bc1q" + crypto.randomBytes(16).toString("hex");
  }

  async getBalance() {
    return [{ asset: "BTC", amount: "0" }];
  }

  async buildTx() {
    return { unsignedTx: "btc_unsigned_stub", fee: "0" };
  }

  async signTx(unsignedTx: string) {
    return { signedTx: `btc_signed(${unsignedTx})` };
  }

  async submitTx(signedTx: string) {
    const txid = crypto.createHash("sha256").update(signedTx).digest("hex");
    return { txid };
  }
}
