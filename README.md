# wallet-enclave

Secure "capabilities API" wrapper around Mesh wallet.

## Goal
Expose wallet operations to an agent **without ever exposing the mnemonic/private keys** to the agent process.

The enclave runs locally (loopback / unix socket) and implements:
- addr / balance
- build_tx → quote → sign_tx → submit_tx
- sign_data / verify_data
- encrypt/decrypt for memory chunks (derived keys)

## Design sketch

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

## Status
Scaffold only (no implementation yet).
