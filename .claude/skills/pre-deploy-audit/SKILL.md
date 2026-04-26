---
name: pre-deploy-audit
description: Run a complete pre-deployment audit before any claim of "ready to ship," "production-ready," "fixed," "done," or "working." MANDATORY use whenever Hridhay says a feature/fix/change is complete, before deploying to Vercel or Railway, when reviewing code for production-readiness, or before committing changes that touch API routes, env vars, webhooks, builds, auth, payments, or database schema. Refuse to allow a "ready" claim until every check passes with verified evidence from a real browser (Playwright MCP), real curl, and real DB query (Supabase MCP). Curl-only or unit-test-only verification is INSUFFICIENT and must be rejected.
---

# Pre-Deploy Audit

Enforces the verify-before-claim rule. Customer-facing claims require browser-level evidence, not endpoint-level checks alone. Fail-fast: stop on the first block, report, do not continue.

## When this skill MUST trigger
- Any phrasing of: "is it ready," "ship it," "deploy this," "production-ready," "fixed," "done," "working now"
- Before opening a PR
- After any change to: API routes, env vars, webhook handlers, auth flow, payment flow (Dodo), email flow (Resend), database schema, Next.js routing
- When the user pastes a deploy URL and asks for confirmation

## Stack assumptions (do not re-ask)
- Repo layout: `frontend/` (React CRA) and `backend/` (Express) side by side
- Deploy: Vercel (frontend), Railway (backend)
- DB: Supabase Postgres (use Supabase MCP)
- Payments: Dodo Payments (Stripe is unavailable in India)
- Email: Resend
- LLM: Groq → Gemini → Anthropic fallback chain
- Browser checks: Playwright MCP (project scope, already installed)

## Audit sequence (run in order, fail-fast)

### 1. Environment integrity
Extract every env var referenced in code:
```
grep -rEoh "process\.env\.[A-Z_][A-Z0-9_]+" frontend/ backend/ --include="*.ts" --include="*.tsx" --include="*.js" | sort -u
```
For each one:
- Check presence in `.env`, `.env.local`
- Use Vercel MCP to verify it exists in production env vars for the layeroi Vercel project
- Use Railway API (or remind user to check Railway dashboard if no Railway MCP yet) for backend env vars
Report missing with file:line references. BLOCK on any missing.

### 2. Build sanity
```
cd frontend && npm run build
cd ../backend && npm run build (or node --check src/server.js if no build step)
```
Capture full output. BLOCK on any non-zero exit, any TypeScript error, any "Failed to compile," any skipped page. Do not soften "build passed" if warnings touched type safety.

### 3. CORS audit (high-frequency bug class)
For every API route under `backend/`:
```
curl -X OPTIONS -H "Origin: https://layeroi.com" -H "Access-Control-Request-Method: POST" -i $ROUTE_URL
```
Verify response has `Access-Control-Allow-Origin` matching the frontend domain and `Access-Control-Allow-Methods` covers the route's actual verbs. BLOCK on any 404 or missing header.

### 4. MIME type audit (high-frequency bug class)
Fetch the deployed homepage HTML, extract every linked `.js`, `.css`, `.json` URL, then:
```
curl -I $ASSET_URL | grep -i content-type
```
Verify: `.js` → `application/javascript`, `.css` → `text/css`, `.json` → `application/json`. BLOCK if any `.js` is served as `text/html` — that means routing is eating asset requests.

### 5. Route 200 audit
Walk every page route in the frontend. For dynamic routes, use a known seeded ID. curl each with `-I` against the deployed URL. BLOCK on any 4xx/5xx.

### 6. Webhook hygiene (run only if webhooks exist)
For each handler under `backend/webhooks/` or `backend/src/api/routes/webhooks.js`:
- Idempotency table reference present
- Signature verification BEFORE any side effect (Dodo Payments signature, Resend signature)
- Raw body parsing BEFORE JSON middleware
- Writes are upserts (idempotent), not raw inserts
BLOCK on any missing.

### 7. Playwright customer journey (the hard rule)
Use Playwright MCP to drive a real browser against the deployed URL. Walk:
1. Homepage loads, no console errors, no network 4xx/5xx
2. Click primary CTA → signup form → submit valid test email
3. Verify email log row in DB (Supabase MCP)
4. Dashboard loads after auth, no console errors
5. Trigger the feature being audited (e.g., for a payment change: click checkout → return success)
6. Use Supabase MCP to verify the expected DB row was written
7. Capture screenshot at each step, save to `.audit/screenshots/$(date +%Y%m%d_%H%M%S)/`
BLOCK on any console error, network failure, missing DB side effect, or visual regression.

## Output format (mandatory)
Final line must be exactly one of:
- `✅ ALL GREEN — safe to claim ready (7/7 checks passed)`
- `🛑 BLOCKED — N/7 checks failed. Details:`

For each failure: file path, line number (where applicable), exact error string, one-line recommended fix.

## What this skill must NEVER do
- Pass the audit because curl returned 200 — Playwright must run
- Pass the audit because unit tests passed — they don't simulate the customer
- Soften failures with words like "minor," "edge case," "mostly working," "shouldn't be a problem"
- Skip a check because "it looks fine in the code"
- Mark complete if any check was skipped for any reason — report skipped checks as failures
