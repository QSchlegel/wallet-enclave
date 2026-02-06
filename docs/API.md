# API — Wallet Enclave (v1)

All endpoints are **local-only** (127.0.0.1 or unix socket). The enclave is designed as a *capabilities API*:
- OpenClaw/agent never receives mnemonics/private keys.
- Policy gates signing/submitting.

## Conventions
- JSON request/response.
- Optional `X-Request-Id` header is propagated into responses + audit log.
- Errors are returned as:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": {},
    "requestId": "..."
  }
}
```

## Endpoints

### GET /health
Response:
```json
{ "ok": true, "service": "wallet-enclave", "ts": "..." }
```

### POST /v1/addr
Request:
```json
{ "chain": "bitcoin" | "cardano" }
```
Response:
```json
{ "chain": "bitcoin" | "cardano", "address": "..." }
```

### POST /v1/balance
Request:
```json
{ "chain": "bitcoin" | "cardano" }
```
Response:
```json
{ "chain": "...", "balances": [{"asset":"BTC|ADA|...","amount":"0"}] }
```

### POST /v1/tx/build
Policy-gated. Builds an **unsigned** transaction intent.

Request:
```json
{ "intent": { "chain":"...", "to":"...", "amount":"...", "asset":"BTC|ADA", "idempotencyKey":"optional" } }
```
Response:
```json
{ "intent": { ... }, "unsignedTx": "opaque", "quote": { "fee": "...", "estimatedAt": "..." } }
```

### POST /v1/tx/sign
Request:
```json
{ "chain": "...", "unsignedTx": "opaque" }
```
Response:
```json
{ "chain": "...", "signedTx": "opaque" }
```

### POST /v1/tx/submit
Requires `idempotencyKey`.

Request:
```json
{ "chain": "...", "signedTx": "opaque", "idempotencyKey": "..." }
```
Response:
```json
{ "chain": "...", "txid": "...", "status": "submitted" | "duplicate" }
```

### POST /v1/crypto/encrypt
Fails closed unless `WALLET_ENCLAVE_MASTER_SECRET` is set.

Request:
```json
{ "context": "...", "plaintextB64": "..." }
```
Response:
```json
{ "context": "...", "ciphertextB64": "...", "nonceB64": "...", "alg": "AES-256-GCM" }
```

### POST /v1/crypto/decrypt
Request:
```json
{ "context": "...", "ciphertextB64": "...", "nonceB64": "..." }
```
Response:
```json
{ "context": "...", "plaintextB64": "...", "alg": "AES-256-GCM" }
```
