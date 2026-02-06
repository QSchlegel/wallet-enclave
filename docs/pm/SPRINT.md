# SPRINT — Wallet Enclave

## Theme
Ship the MVP skeleton with real policy enforcement and stubbed chain adapters.

## Goals (this sprint)
- Service runs locally, endpoints exist, policy blocks dangerous actions.
- Tests prove: allowlist/caps/idempotency/audit log.

## Tasks (keep each ≤90m)
- [ ] Spec: API schema + error model
- [ ] Implement audit log JSONL + request id
- [ ] Implement allowlist + caps policy (unit tests)
- [ ] Implement idempotency store (in-memory + file-backed)
- [ ] Implement endpoints (health, addr, balance, tx build/sign/submit)
- [ ] Crypto: HKDF + encrypt/decrypt endpoints
