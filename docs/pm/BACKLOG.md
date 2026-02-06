# BACKLOG — Wallet Enclave

## P0 — MVP (must ship)
- [ ] Define API schema + error model (single source of truth)
- [ ] Policy engine (allowlist + caps + fee caps + approval-required responses)
- [ ] Audit log (append-only JSONL)
- [ ] Idempotency store for submit
- [ ] Implement HTTP server endpoints (bind 127.0.0.1)
- [ ] Chain adapter interfaces (Bitcoin/Cardano) + stub implementations
- [ ] Crypto: HKDF derive + encrypt/decrypt (AEAD)
- [ ] CLI smoke tests (curl-based) + CI

## P1 — Mesh integration
- [ ] Plug in Mesh for Cardano (build/sign/submit)
- [ ] Plug in Mesh for Bitcoin (build/sign/submit)
- [ ] Fee estimation adapters

## P2 — Ops hardening
- [ ] systemd unit + env handling
- [ ] Unix socket transport option
- [ ] mTLS / request signing (if remote)
- [ ] Metrics (prometheus) + health probes

## P3 — UX
- [ ] Human approval workflow (challenge/response)
- [ ] Address book management (labels)
