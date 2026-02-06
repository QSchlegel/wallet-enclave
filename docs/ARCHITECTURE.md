# Architecture — Wallet Enclave

## Purpose
The wallet enclave is a **separate, lightweight daemon** that exposes a local-only capabilities API around Mesh wallet.

The core goal is capability-based access:
- The agent/OpenClaw process **never** receives a mnemonic or private keys.
- The enclave holds secrets and enforces policy.

## Separation of concerns

### OpenClaw / agent runtime (untrusted-by-default)
- Runs tools, cron, LLM calls.
- May be prompt-injected or coerced.
- Must not be able to exfiltrate wallet secrets.

### Wallet Enclave (trusted boundary)
- Dedicated process (ideally dedicated OS user, e.g. `walletd`).
- Holds mnemonic in OS keychain/HSM/enclave storage.
- Enforces:
  - allowlist destinations
  - per-tx/per-day caps
  - fee caps
  - idempotency (prevent accidental duplicate submits)
  - append-only audit log
- Exposes **local-only** API:
  - bind `127.0.0.1` or unix domain socket
  - never exposed publicly

## Threat model (MVP)
- Assume OpenClaw can be tricked into requesting a payment.
- Enclave policy must prevent:
  - new destinations without approval
  - spending above caps
  - unusual fees
  - duplicate sends due to retries/timeouts

## Data files
- `policy.json` — allowlists + caps (operator-managed)
- `audit.jsonl` — append-only record of requests and decisions
- `idempotency.jsonl` or small KV — dedupe of submit intents

## Diagram

```
+--------------------+        local (unix sock / 127.0.0.1)        +---------------------------+
|   OpenClaw Agent   |  ----------------------------------------> |       Wallet Enclave      |
| (no secrets ever)  |                                            | (Mesh wrapper + policy)   |
+--------------------+                                            +-------------+-------------+
            |                                                                    |
            |  search -> ids -> decrypt top-N                                    | Mesh SDK
            v                                                                    v
+--------------------+                                            +---------------------------+
|   Mem Bank (raw)   |  <--- ciphertext chunks --- encrypt/decrypt|  Mnemonic in enclave/HSM  |
| embeddings (plain) |                                            |  (never exported)         |
+--------------------+                                            +---------------------------+
            |
            v
+--------------------+
|  Mem Vault (MD KG) |
| curated + shared   |
+--------------------+
```
