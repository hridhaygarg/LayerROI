"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  LayeroiClient: () => LayeroiClient,
  PRICING: () => PRICING,
  computeCost: () => computeCost,
  fetchPricing: () => fetchPricing,
  getModelProvider: () => getModelProvider,
  layeroi: () => layeroi
});
module.exports = __toCommonJS(index_exports);

// src/transport.ts
var MAX_BATCH = 50;
var FLUSH_INTERVAL_MS = 5e3;
var MAX_RETRIES = 3;
var BASE_DELAY_MS = 1e3;
var Transport = class {
  constructor(endpoint, apiKey, debug = false) {
    this.buffer = [];
    this.timer = null;
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.debug = debug;
  }
  push(record) {
    this.buffer.push(record);
    if (this.buffer.length >= MAX_BATCH) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
    }
  }
  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0);
    this.send(batch).catch(() => {
    });
  }
  async send(records, attempt = 0) {
    const payload = { records };
    try {
      const res = await fetch(`${this.endpoint}/v1/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Layeroi-Key": this.apiKey
        },
        body: JSON.stringify(payload)
      });
      if (this.debug) {
        console.log(`[layeroi] flush ${records.length} records \u2192 ${res.status}`);
      }
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        if (this.debug) {
          console.log(`[layeroi] retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
        }
        await new Promise((r) => setTimeout(r, delay));
        return this.send(records, attempt + 1);
      }
      if (this.debug) {
        console.error(`[layeroi] dropped ${records.length} records after ${MAX_RETRIES} retries`);
      }
    }
  }
  destroy() {
    this.flush();
  }
};

// src/wrap-openai.ts
var import_node_crypto = require("crypto");

// src/pricing.ts
var PRICING = {
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  // Anthropic — current generation
  "claude-opus-4-5": { input: 15, output: 75 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  // Anthropic — legacy (dated variants matched via normalizeModel prefix)
  "claude-3-5-sonnet": { input: 3, output: 15 },
  "claude-3-5-haiku": { input: 0.8, output: 4 },
  "claude-3-opus": { input: 15, output: 75 },
  "claude-3-haiku": { input: 0.25, output: 1.25 }
};
function normalizeModel(model) {
  const lower = model.toLowerCase();
  for (const key of Object.keys(PRICING)) {
    if (lower.startsWith(key)) return key;
  }
  return lower;
}
function computeCost(model, promptTokens, completionTokens) {
  const normalized = normalizeModel(model);
  const pricing = PRICING[normalized];
  if (!pricing) return 0;
  const cost = (promptTokens * pricing.input + completionTokens * pricing.output) / 1e6;
  return Math.round(cost * 1e6) / 1e6;
}
function getModelProvider(model) {
  const lower = model.toLowerCase();
  if (lower.startsWith("gpt-") || lower.startsWith("o1") || lower.startsWith("o3")) return "openai";
  if (lower.startsWith("claude")) return "anthropic";
  if (lower.startsWith("gemini")) return "google";
  return "unknown";
}
async function fetchPricing() {
  return PRICING;
}

// src/context.ts
var import_node_async_hooks = require("async_hooks");
var storage = new import_node_async_hooks.AsyncLocalStorage();
function getTaskContext() {
  return storage.getStore();
}
function runWithTask(ctx, fn) {
  return storage.run(ctx, fn);
}

// src/wrap-openai.ts
var SDK_VERSION = "0.2.0";
function wrapOpenAI(client, options, transport) {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "chat" && value && typeof value === "object") {
        return new Proxy(value, {
          get(chatTarget, chatProp, chatReceiver) {
            const chatValue = Reflect.get(chatTarget, chatProp, chatReceiver);
            if (chatProp === "completions" && chatValue && typeof chatValue === "object") {
              return new Proxy(chatValue, {
                get(compTarget, compProp, compReceiver) {
                  const compValue = Reflect.get(compTarget, compProp, compReceiver);
                  if (compProp === "create" && typeof compValue === "function") {
                    return async function interceptedCreate(...args) {
                      const params = args[0];
                      const model = params?.model || "unknown";
                      const startMs = Date.now();
                      let response;
                      let status = "success";
                      let errorMessage;
                      try {
                        response = await compValue.apply(compTarget, args);
                      } catch (err) {
                        status = "error";
                        errorMessage = err instanceof Error ? err.message : String(err);
                        throw err;
                      } finally {
                        const latencyMs = Date.now() - startMs;
                        const usage = response?.usage;
                        const promptTokens = usage?.prompt_tokens ?? 0;
                        const completionTokens = usage?.completion_tokens ?? 0;
                        const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;
                        const taskCtx = getTaskContext();
                        const record = {
                          sdk_record_id: (0, import_node_crypto.randomUUID)(),
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
                            ...taskCtx?.metadata
                          },
                          sdk_version: SDK_VERSION,
                          timestamp: (/* @__PURE__ */ new Date()).toISOString()
                        };
                        transport.push(record);
                      }
                      return response;
                    };
                  }
                  return compValue;
                }
              });
            }
            return chatValue;
          }
        });
      }
      return value;
    }
  });
}

// src/wrap-anthropic.ts
var import_node_crypto2 = require("crypto");
var SDK_VERSION2 = "0.2.0";
function wrapAnthropic(client, options, transport) {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "messages" && value && typeof value === "object") {
        return new Proxy(value, {
          get(msgTarget, msgProp, msgReceiver) {
            const msgValue = Reflect.get(msgTarget, msgProp, msgReceiver);
            if (msgProp === "create" && typeof msgValue === "function") {
              return async function interceptedCreate(...args) {
                const params = args[0];
                const model = params?.model || "unknown";
                const startMs = Date.now();
                let response;
                let status = "success";
                let errorMessage;
                try {
                  response = await msgValue.apply(msgTarget, args);
                } catch (err) {
                  status = "error";
                  errorMessage = err instanceof Error ? err.message : String(err);
                  throw err;
                } finally {
                  try {
                    const latencyMs = Date.now() - startMs;
                    const usage = response?.usage;
                    const promptTokens = usage?.input_tokens ?? 0;
                    const completionTokens = usage?.output_tokens ?? 0;
                    const totalTokens = promptTokens + completionTokens;
                    const taskCtx = getTaskContext();
                    const costUsd = computeCost(model, promptTokens, completionTokens);
                    const record = {
                      sdk_record_id: (0, import_node_crypto2.randomUUID)(),
                      agent: options.agent,
                      task_id: taskCtx?.taskId,
                      model,
                      provider: "anthropic",
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
                        ...costUsd === 0 && model !== "unknown" ? { pricing_warning: "unknown_model" } : {}
                      },
                      sdk_version: SDK_VERSION2,
                      timestamp: (/* @__PURE__ */ new Date()).toISOString()
                    };
                    transport.push(record);
                  } catch {
                  }
                }
                return response;
              };
            }
            return msgValue;
          }
        });
      }
      return value;
    }
  });
}
function isAnthropicClient(client) {
  if (!client || typeof client !== "object") return false;
  const c = client;
  const messages = c.messages;
  if (!messages || typeof messages !== "object") return false;
  const create = messages.create;
  if (typeof create !== "function") return false;
  const name = client.constructor?.name;
  if (name === "Anthropic") return true;
  const opts = c._options;
  if (typeof opts?.baseURL === "string" && opts.baseURL.includes("anthropic")) return true;
  if (!c.chat) return true;
  return false;
}

// src/client.ts
var DEFAULT_ENDPOINT = "https://api.layeroi.com";
var LayeroiClient = class {
  constructor() {
    this.config = null;
    this.transport = null;
  }
  init(config) {
    this.config = {
      ...config,
      endpoint: config.endpoint || DEFAULT_ENDPOINT
    };
    this.transport = new Transport(
      this.config.endpoint,
      this.config.apiKey,
      this.config.debug
    );
  }
  wrap(client, options) {
    if (!this.transport) {
      throw new Error("layeroi.init() must be called before wrap()");
    }
    if (isAnthropicClient(client)) {
      return wrapAnthropic(client, options, this.transport);
    }
    return wrapOpenAI(client, options, this.transport);
  }
  async task(taskId, metadata, fn) {
    const ctx = { taskId, metadata: metadata ?? void 0 };
    return runWithTask(ctx, fn);
  }
  flush() {
    this.transport?.flush();
  }
  destroy() {
    this.transport?.destroy();
  }
};

// src/index.ts
var layeroi = new LayeroiClient();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LayeroiClient,
  PRICING,
  computeCost,
  fetchPricing,
  getModelProvider,
  layeroi
});
