import { Chain } from "../v1/schema.js";
import { ChainAdapter } from "./adapter.js";
import { StubBitcoinAdapter } from "./stub_bitcoin.js";
import { StubCardanoAdapter } from "./stub_cardano.js";

export function adapterFor(chain: Chain): ChainAdapter {
  switch (chain) {
    case "bitcoin":
      return new StubBitcoinAdapter();
    case "cardano":
      return new StubCardanoAdapter();
  }
}
