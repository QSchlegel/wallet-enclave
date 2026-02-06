import crypto from "node:crypto";
import { ChainAdapter } from "./adapter.js";

export class StubCardanoAdapter implements ChainAdapter {
  chain = "cardano" as const;

  async getAddress(): Promise<string> {
    return "addr1" + crypto.randomBytes(16).toString("hex");
  }

  async getBalance() {
    return [{ asset: "ADA", amount: "0" }];
  }

  async buildTx() {
    return { unsignedTx: "ada_unsigned_stub", fee: "0" };
  }

  async signTx(unsignedTx: string) {
    return { signedTx: `ada_signed(${unsignedTx})` };
  }

  async submitTx(signedTx: string) {
    const txid = crypto.createHash("sha256").update(signedTx).digest("hex");
    return { txid };
  }
}
