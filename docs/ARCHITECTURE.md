# Architecture — Wallet Enclave

## TL;DR
- **Wallet Enclave** is a tiny, separate daemon that holds keys and enforces policy.
- **OpenClaw/agent** is treated as untrusted-by-default.
- OpenClaw talks to the enclave over **local-only** transport (loopback HTTP or unix socket).
- The agent never sees mnemonics/private keys; it only gets **capabilities** (approved actions).

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

## Diagram (Mermaid)

```mermaid
flowchart LR
  A[OpenClaw / Agent runtime\n(untrusted-by-default)]
  E[Wallet Enclave daemon\n(trusted boundary)]
  M[Mesh SDK / Chain RPC]

  subgraph Files[Local files (operator-controlled)]
    P[policy.json\nallowlist + caps]
    L[audit.jsonl\nappend-only]
    I[idempotency store\ndedupe submits]
  end

  A -- "local-only HTTP (127.0.0.1)\nor unix socket" --> E
  E --> M

  E --- P
  E --- L
  E --- I

  note right of A
    No mnemonic/private keys.
    Requests capabilities only.
  end

  note right of E
    Holds mnemonic/HSM handle.
    Enforces policy + logs.
  end
```
