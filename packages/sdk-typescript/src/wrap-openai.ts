import { randomUUID } from 'node:crypto';
import type { LogRecord, WrapOptions } from './types.js';
import { computeCost, getModelProvider } from './pricing.js';
import { getTaskContext } from './context.js';
import type { Transport } from './transport.js';

const SDK_VERSION = '0.2.0';

/**
 * Wraps an OpenAI client instance with a Proxy that intercepts
 * chat.completions.create() to record cost/latency/tokens.
 */
export function wrapOpenAI<T extends object>(
  client: T,
  options: WrapOptions,
  transport: Transport,
): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      // Intercept client.chat → return proxy for chat
      if (prop === 'chat' && value && typeof value === 'object') {
        return new Proxy(value, {
          get(chatTarget, chatProp, chatReceiver) {
            const chatValue = Reflect.get(chatTarget, chatProp, chatReceiver);

            // Intercept client.chat.completions → return proxy for completions
            if (chatProp === 'completions' && chatValue && typeof chatValue === 'object') {
              return new Proxy(chatValue, {
                get(compTarget, compProp, compReceiver) {
                  const compValue = Reflect.get(compTarget, compProp, compReceiver);

                  // Intercept client.chat.completions.create()
                  if (compProp === 'create' && typeof compValue === 'function') {
                    return async function interceptedCreate(...args: unknown[]) {
                      const params = args[0] as Record<string, unknown> | undefined;
                      const model = (params?.model as string) || 'unknown';
                      const startMs = Date.now();

                      let response: unknown;
                      let status: 'success' | 'error' = 'success';
                      let errorMessage: string | undefined;

                      try {
                        response = await compValue.apply(compTarget, args);
                      } catch (err: unknown) {
                        status = 'error';
                        errorMessage = err instanceof Error ? err.message : String(err);
                        throw err; // Re-throw — SDK never swallows customer errors
                      } finally {
                        const latencyMs = Date.now() - startMs;
                        const usage = (response as Record<string, unknown>)?.usage as
                          | { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
                          | undefined;

                        const promptTokens = usage?.prompt_tokens ?? 0;
                        const completionTokens = usage?.completion_tokens ?? 0;
                        const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;

                        const taskCtx = getTaskContext();

                        const record: LogRecord = {
                          sdk_record_id: randomUUID(),
                          agent: options.agent,
                          task_id: taskCtx?.taskId,
                          model,
                          provider: getModelProvider(model),
                          prompt_tokens: promptTokens,
                          completion_tokens: completionTokens,
                          total_tokens: totalTokens,
                          cost_usd: computeCost(model, promptTokens, completionTokens),
                          latency_ms: latencyMs,
                          status,
                          error_message: errorMessage,
                          metadata: {
                            ...options.metadata,
                            ...taskCtx?.metadata,
                          },
                          sdk_version: SDK_VERSION,
                          timestamp: new Date().toISOString(),
                        };

                        transport.push(record);
                      }

                      return response;
                    };
                  }

                  return compValue;
                },
              });
            }

            return chatValue;
          },
        });
      }

      return value;
    },
  });
}
