// All configuration constants in one place
export const CONFIG = {
  // API Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_BASE_URL: process.env.API_BASE_URL || 'https://api.layeroi.com',

  // CORS allowed origins
  ALLOWED_ORIGINS: [
    'https://layeroi.com',
    'https://www.layeroi.com',
    'https://app.layeroi.com',
    'https://api.layeroi.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ],

  // LLM Provider Configuration
  LLM_PRICING: {
    // OpenAI
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'o1': { input: 15.00, output: 60.00 },
    'o1-mini': { input: 3.00, output: 12.00 },
    'o3-mini': { input: 1.10, output: 4.40 },
    // Anthropic
    'claude-opus-4-6': { input: 15.00, output: 75.00 },
    'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
    'claude-haiku-4-5': { input: 0.25, output: 1.25 },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    // Google
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    'gemini-2.0-pro': { input: 1.25, output: 5.00 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  },

  // Plan limits
  PLAN_LIMITS: {
    free: { agents: 2, history_days: 14, api_calls_per_min: 10 },
    starter: { agents: 5, history_days: 90, api_calls_per_min: 60 },
    business: { agents: 30, history_days: 365, api_calls_per_min: 300 },
    enterprise: { agents: -1, history_days: 1095, api_calls_per_min: 1000 },
  },

  // Anomaly detection thresholds
  ANOMALY_THRESHOLDS: {
    calls_per_90_seconds: 15,
    cost_spike_multiplier: 5,
    spike_window_minutes: 10,
  },

  // Pricing model limits
  PRICING_TIERS: {
    starter: { monthly_cost: 499, max_agents: 5 },
    business: { monthly_cost: 2500, max_agents: 30 },
    enterprise: { monthly_cost: 0, max_agents: -1 }, // Custom pricing
  },

  // Request timeouts
  TIMEOUT_MS: {
    health_check: 10000,
    proxy_forward: 60000,
    db_query: 30000,
  },

  // Webhook configuration
  WEBHOOK_RETRY_ATTEMPTS: 3,
  WEBHOOK_TIMEOUT_MS: 10000,
  WEBHOOK_RETRY_DELAYS_MS: [5 * 60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000], // 5min, 30min, 2hr

  // Rate limiting
  RATE_LIMITS: {
    proxy: { max_per_hour: 1000 },
    api: { max_per_minute: 300 },
    auth: { max_per_minute: 10 },
  },

  // Email configuration
  EMAILS: {
    from: 'Layer ROI <hello@layeroi.com>',
    support: 'support@layeroi.com',
  },
};

// Prices are per million tokens
// Unknown models default to gpt-4o pricing (conservative estimate)
export const DEFAULT_MODEL_PRICE = CONFIG.LLM_PRICING['gpt-4o'];
