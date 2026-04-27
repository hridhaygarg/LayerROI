# layeroi-sdk

Auto-instrument your AI agent LLM calls. Track cost, latency, tokens, and ROI per agent — zero config.

## Install

```bash
npm install layeroi-sdk openai
```

## Quick Start

```typescript
import { layeroi } from 'layeroi-sdk';
import OpenAI from 'openai';

// 1. Initialize once at app startup
layeroi.init({
  apiKey: process.env.LAYEROI_API_KEY!,
});

// 2. Wrap your OpenAI client
const openai = layeroi.wrap(new OpenAI(), {
  agent: 'support-copilot',
});

// 3. Use normally — every call is auto-instrumented
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
});
// Cost, tokens, latency automatically tracked in your Layeroi dashboard
```

## Task Grouping

Group multi-call agent runs under a single task ID:

```typescript
await layeroi.task('handle_ticket_123', { user_id: 'u_456' }, async () => {
  const classify = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Classify this ticket...' }],
  });

  const reply = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Draft a reply...' }],
  });
  // Both calls tagged with task_id: 'handle_ticket_123'
});
```

## Multiple Agents

```typescript
const support = layeroi.wrap(new OpenAI(), { agent: 'support-copilot' });
const sales = layeroi.wrap(new OpenAI(), { agent: 'sales-researcher' });
const classifier = layeroi.wrap(new OpenAI(), { agent: 'invoice-classifier' });

// Each agent's costs tracked separately in your Layeroi P&L
```

## Anthropic Support

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { layeroi } from 'layeroi-sdk';

layeroi.init({ apiKey: process.env.LAYEROI_API_KEY! });
const anthropic = layeroi.wrap(new Anthropic(), { agent: 'support-copilot' });

// Use normally — every call is auto-instrumented
const msg = await anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }],
});
```

`wrap()` auto-detects the provider — no config needed. Works with both OpenAI and Anthropic clients.

## Configuration

```typescript
layeroi.init({
  apiKey: 'sk-layeroi-...',       // Required — from layeroi.com/admin
  endpoint: 'https://api.layeroi.com', // Optional — defaults to production
  debug: false,                    // Optional — logs flush activity to console
});
```

## How It Works

1. `wrap()` returns a Proxy around your LLM client (OpenAI or Anthropic)
2. Every `chat.completions.create()` or `messages.create()` call is intercepted
3. Token usage, cost (pre-computed from model pricing), and latency are captured
4. Records batch in memory (50 records or 5 seconds, whichever first)
5. Batches POST to Layeroi's `/v1/log` endpoint asynchronously
6. **Zero impact on your LLM calls** — SDK failures are silent, never throw

## Supported Providers

| Provider | Status |
|----------|--------|
| OpenAI | ✅ v0.1.0 |
| Anthropic | ✅ v0.2.0 |
| AWS Bedrock | 🔜 v0.2.0 |
| Google Gemini | 🔜 v0.2.0 |

## License

MIT
