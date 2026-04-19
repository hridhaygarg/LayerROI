import { Axiom } from '@axiomhq/js';

// Initialize Axiom client (no-op if env vars not set)
let axiom = null;
const axiomDataset = process.env.AXIOM_DATASET || 'layeroi-logs';

if (process.env.AXIOM_TOKEN) {
  axiom = new Axiom({
    token: process.env.AXIOM_TOKEN,
  });
}

function sendToAxiom(logEntry) {
  if (!axiom) return;
  try {
    axiom.ingest(axiomDataset, [logEntry]);
  } catch (err) {
    // Avoid infinite loops -- only console.error, don't call logger
    console.error('Axiom ingest error:', err.message);
  }
}

// Flush Axiom buffer periodically and on shutdown
function flushAxiom() {
  if (!axiom) return;
  axiom.flush().catch((err) => {
    console.error('Axiom flush error:', err.message);
  });
}

// Flush every 10 seconds
setInterval(flushAxiom, 10_000).unref();

// Flush on process exit signals
for (const signal of ['SIGTERM', 'SIGINT', 'beforeExit']) {
  process.on(signal, flushAxiom);
}

// Structured JSON logging for all backend operations
export const logger = {
  info: (message, context = {}) => {
    const entry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      service: 'layeroi-api',
      ...context
    };
    console.log(JSON.stringify(entry));
    sendToAxiom(entry);
  },

  error: (message, error, context = {}) => {
    const entry = {
      level: 'error',
      message,
      error: error?.message || '',
      stack: error?.stack || '',
      timestamp: new Date().toISOString(),
      service: 'layeroi-api',
      ...context
    };
    console.error(JSON.stringify(entry));
    sendToAxiom(entry);
  },

  warn: (message, context = {}) => {
    const entry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      service: 'layeroi-api',
      ...context
    };
    console.warn(JSON.stringify(entry));
    sendToAxiom(entry);
  },

  debug: (message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const entry = {
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        service: 'layeroi-api',
        ...context
      };
      console.log(JSON.stringify(entry));
      sendToAxiom(entry);
    }
  }
};

export { flushAxiom };
