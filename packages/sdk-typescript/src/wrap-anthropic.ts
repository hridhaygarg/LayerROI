import { randomUUID } from 'node:crypto';
import type { LogRecord, WrapOptions } from './types.js';
import { computeCost } from './pricing.js';
import { getTaskContext } from './context.js';
import type { Transport } from './transport.js';

const SDK_VERSION = '0.2.0';

/**
 * Wraps an Anthropic client instance with a Proxy that intercepts
 * messages.create() to record cost/latency/tokens.
 *
 * Anthropic response shape:
 * { id, type: 'message', role, content, model, stop_reason,
 *   usage: { input_tokens, output_tokens, cache_creation_input_tokens?, cache_read_input_tokens? } }
 */
export function wrapAnthropic<T extends object>(
  client: T,
  options: WrapOptions,
  transport: Transport,
): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      // Intercept client.messages → return proxy for messages
      if (prop === 'messages' && value && typeof value === 'object') {
        return new Proxy(value, {
          get(msgTarget, msgProp, msgReceiver) {
            const msgValue = Reflect.get(msgTarget, msgProp, msgReceiver);

            // Intercept client.messages.create()
            if (msgProp === 'create' && typeof msgValue === 'function') {
              return async function interceptedCreate(...args: unknown[]) {
                const params = args[0] as Record<string, unknown> | undefined;
                const model = (params?.model as string) || 'unknown';
                const startMs = Date.now();

                let response: unknown;
                let status: 'success' | 'error' = 'success';
                let errorMessage: string | undefined;

                try {
                  response = await msgValue.apply(msgTarget, args);
                } catch (err: unknown) {
                  status = 'error';
                  errorMessage = err instanceof Error ? err.message : String(err);
                  throw err; // Re-throw — SDK never swallows customer errors
                } finally {
                  try {
                    const latencyMs = Date.now() - startMs;
                    const usage = (response as Record<string, unknown>)?.usage as
                      | { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number }
                      | undefined;

                    const promptTokens = usage?.input_tokens ?? 0;
                    const completionTokens = usage?.output_tokens ?? 0;
                    // TODO: Handle prompt caching cost calculation in v0.3
                    // cache_creation_input_tokens and cache_read_input_tokens have different pricing
                    const totalTokens = promptTokens + completionTokens;

                    const taskCtx = getTaskContext();
                    const costUsd = computeCost(model, promptTokens, completionTokens);

                    const record: LogRecord = {
                      sdk_record_id: randomUUID(),
                      agent: options.agent,
                      task_id: taskCtx?.taskId,
                      model,
                      provider: 'anthropic',
                      prompt_tokens: promptTokens,
                      completion_tokens: completionTokens,
                      total_tokens: totalTokens,
                      cost_usd: costUsd,
                      latency_ms: latencyMs,
                      status,
                      error_message: errorMessage,
                      metadata: {
                        ...options.metadata,
                        ...taskCtx?.metadata,
                        ...(costUsd === 0 && model !== 'unknown' ? { pricing_warning: 'unknown_model' } : {}),
                      },
                      sdk_version: SDK_VERSION,
                      timestamp: new Date().toISOString(),
                    };

                    transport.push(record);
                  } catch {
                    // Silent — never interfere with customer code
                  }
                }

                return response;
              };
            }

            // TODO: Wrap client.messages.stream() in v0.3
            // Streaming requires intercepting the async iterator and capturing
            // the final message_stop event for usage data.

            return msgValue;
          },
        });
      }

      return value;
    },
  });
}

/**
 * Duck-type detection: is this an Anthropic client?
 * Checks for messages.create method + Anthropic-like constructor name or baseURL.
 */
export function isAnthropicClient(client: unknown): boolean {
  if (!client || typeof client !== 'object') return false;
  const c = client as Record<string, unknown>;

  // Check for messages.create method
  const messages = c.messages;
  if (!messages || typeof messages !== 'object') return false;
  const create = (messages as Record<string, unknown>).create;
  if (typeof create !== 'function') return false;

  // Distinguish from OpenAI (which doesn't have top-level messages)
  // Anthropic clients have: constructor named 'Anthropic' or '_options' with baseURL containing 'anthropic'
  const name = (client as { constructor?: { name?: string } }).constructor?.name;
  if (name === 'Anthropic') return true;

  const opts = c._options as Record<string, unknown> | undefined;
  if (typeof opts?.baseURL === 'string' && opts.baseURL.includes('anthropic')) return true;

  // If it has messages.create but NOT chat.completions (OpenAI), it's likely Anthropic
  if (!c.chat) return true;

  return false;
}
