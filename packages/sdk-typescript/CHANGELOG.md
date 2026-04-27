# Changelog

## 0.2.0 (2026-04-28)

### Features
- Anthropic SDK support: `wrap()` auto-detects Anthropic clients and intercepts `messages.create()`
- 7 new Anthropic model pricing entries (claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5 + legacy variants)
- Duck-type provider detection: no need to specify provider — `wrap()` routes automatically
- Pricing lookup tolerant of dated model suffixes (e.g., claude-3-5-sonnet-20241022 → claude-3-5-sonnet)

### Not yet shipped
- Anthropic streaming (`messages.stream()`) — deferred to v0.3
- Prompt caching cost calculation (`cache_creation_input_tokens`, `cache_read_input_tokens`) — deferred to v0.3

## 0.1.0 (2026-04-25)

### Features
- Initial release
- OpenAI `chat.completions.create` auto-instrumentation via `wrap()`
- Task grouping via `task()` with AsyncLocalStorage context propagation
- Batched transport (50 records / 5s flush interval)
- Pre-computed cost from built-in model pricing table
- Silent failure mode — SDK errors never interrupt customer code
- ESM + CJS dual output
