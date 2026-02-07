# microk8s dev deploy

Apply:
```bash
microk8s kubectl apply -k k8s/overlays/dev
```

Port-forward (keeps service private inside the cluster):
```bash
microk8s kubectl port-forward deploy/wallet-enclave-dev 3377:3377
curl -s http://127.0.0.1:3377/health
```

Secrets (example; do NOT commit real values):
```bash
microk8s kubectl create secret generic wallet-enclave-secrets \
  --from-literal=WALLET_ENCLAVE_MASTER_SECRET='...' \
  --from-literal=BLOCKFROST_PROJECT_ID='...' \
  --from-literal=BLOCKFROST_NETWORK='preview'
```
