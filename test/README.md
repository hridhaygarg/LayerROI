# Tests

## SDK Smoke Test

End-to-end verification of `layeroi-sdk` → `/v1/log` → `api_logs` pipeline against production.

### Run

```bash
# Basic (tests HTTP endpoints, skips DB verification)
node test/sdk-smoke.js

# Full (includes Supabase DB verification + cleanup)
SUPABASE_KEY=<service-role-key> node test/sdk-smoke.js

# With custom API key
LAYEROI_API_KEY=sk-layeroi-... node test/sdk-smoke.js
```

### What it tests

1. **Ingestion**: Sends 50 records in 2 batches via `POST /v1/log`
2. **Idempotency**: Resends first 25 records, verifies no duplicates
3. **Auth**: Verifies bad API key returns 401
4. **DB verification** (with SUPABASE_KEY): Confirms all 50 records in `api_logs`, cost matches pricing table, task_ids correct, agents auto-created
5. **Cleanup**: Removes smoke test data after verification
