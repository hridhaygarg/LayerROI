/**
 * Environment configuration with validation
 * Validates all required environment variables at startup
 */

const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'REDIS_URL'
];

const OPTIONAL_VARS = {
  NODE_ENV: 'development',
  PORT: '3001',
  LOG_LEVEL: 'info',
  JWT_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  SESSION_TTL_MS: '86400000', // 24 hours in milliseconds
  ANTHROPIC_API_KEY: '',
  STRIPE_SECRET_KEY: '',
  STRIPE_PUBLIC_KEY: '',
  SENTRY_DSN: '',
  DD_API_KEY: '',
  DD_APP_KEY: '',
  DD_SITE: 'datadoghq.com',
  CLOUDFLARE_API_TOKEN: '',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
  MICROSOFT_CLIENT_ID: '',
  MICROSOFT_CLIENT_SECRET: ''
};

/**
 * Load and validate environment configuration
 * @returns {Object} Configuration object with all env vars
 * @throws {Error} If required env var is missing or invalid
 */
export function loadConfig() {
  const config = {};

  // Load and validate required vars
  for (const key of REQUIRED_VARS) {
    const value = process.env[key];

    if (!value && process.env.NODE_ENV !== 'test') {
      throw new Error(`Missing required environment variable: ${key}`);
    }

    config[key] = value || 'test-value';
  }

  // Validate JWT_SECRET minimum length
  if (config.JWT_SECRET.length < 32 && process.env.NODE_ENV !== 'test') {
    throw new Error(
      `JWT_SECRET must be at least 32 characters. Current length: ${config.JWT_SECRET.length}`
    );
  }

  // Load optional vars with defaults
  for (const [key, defaultValue] of Object.entries(OPTIONAL_VARS)) {
    config[key] = process.env[key] || defaultValue;
  }

  // Type coercion
  config.PORT = parseInt(config.PORT, 10);
  config.SESSION_TTL_MS = parseInt(config.SESSION_TTL_MS, 10);

  // Validate PORT is a valid number
  if (isNaN(config.PORT)) {
    throw new Error(`PORT must be a valid number, got: ${process.env.PORT}`);
  }

  return config;
}

// Singleton pattern to ensure config loaded only once
let cachedConfig = null;

/**
 * Get cached configuration (loads once on first call)
 * @returns {Object} Configuration object
 */
export function getConfig() {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}
