// Structured JSON logging for all backend operations
export const logger = {
  info: (message, context = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      service: 'layeroi-api',
      ...context
    }));
  },

  error: (message, error, context = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message || '',
      stack: error?.stack || '',
      timestamp: new Date().toISOString(),
      service: 'layeroi-api',
      ...context
    }));
  },

  warn: (message, context = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      service: 'layeroi-api',
      ...context
    }));
  },

  debug: (message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        service: 'layeroi-api',
        ...context
      }));
    }
  }
};
