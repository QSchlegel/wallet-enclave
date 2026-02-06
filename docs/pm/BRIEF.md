# Wallet Enclave — Brief

Goal: a local-only **capabilities API** around Mesh (Bitcoin + Cardano) where the mnemonic never leaves the enclave.

## Non-goals (v0)
- No remote exposure (no public HTTP).
- No “agent has keys”.

## Core capabilities
- addr / balance
- build_tx → quote → sign_tx → submit_tx
- sign_data / verify_data
- encrypt/decrypt for Mem Bank/Vault chunks (HKDF-derived keys)

## Guardrails
- allowlist destinations by label
- per-tx + per-day caps
- fee caps
- idempotency_key required for submit
- append-only audit log

## MVP deliverable
A running service on 127.0.0.1 with stubbed chain adapters + real policy enforcement + smoke tests.
