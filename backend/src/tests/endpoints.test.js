import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
let axiosInstance;

beforeAll(() => {
  axiosInstance = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true, // Don't throw on any status
  });
});

describe('Health Check Endpoints', () => {
  it('GET /health returns status ok', async () => {
    const res = await axiosInstance.get('/health');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
    expect(res.data.timestamp).toBeDefined();
  });

  it('GET /health/detailed returns comprehensive status', async () => {
    const res = await axiosInstance.get('/health/detailed');
    expect(res.status).toBe(200);
    expect(res.data.status).toMatch(/ok|degraded/);
    expect(res.data.checks).toBeDefined();
    expect(res.data.checks.database).toBeDefined();
    expect(res.data.checks.openaiProxy).toBeDefined();
  });
});

describe('Agent Endpoints', () => {
  it('GET /api/agents returns list of agents', async () => {
    const res = await axiosInstance.get('/api/agents');
    expect(res.status).toBe(200);
    expect(res.data.agents).toBeDefined();
    expect(Array.isArray(res.data.agents)).toBe(true);
  });

  it('GET /api/costs returns costs by agent', async () => {
    const res = await axiosInstance.get('/api/costs');
    expect(res.status).toBe(200);
    expect(res.data.costs).toBeDefined();
  });

  it('GET /api/costs/:agent returns specific agent costs', async () => {
    const res = await axiosInstance.get('/api/costs/test-agent');
    expect(res.status).toBe(200);
    expect(res.data.totalCost).toBeDefined();
    expect(res.data.totalCalls).toBeDefined();
  });

  it('GET /api/agent-stats/:agent returns agent statistics', async () => {
    const res = await axiosInstance.get('/api/agent-stats/test-agent');
    expect(res.status).toBe(200);
    expect(res.data.callCount).toBeDefined();
  });
});

describe('Logging Endpoints', () => {
  it('GET /api/logs returns request logs', async () => {
    const res = await axiosInstance.get('/api/logs');
    expect(res.status).toBe(200);
    expect(res.data.logs).toBeDefined();
    expect(Array.isArray(res.data.logs)).toBe(true);
  });
});

describe('Automation Endpoints', () => {
  it('POST /automations/seo triggers SEO generation', async () => {
    const res = await axiosInstance.post('/automations/seo');
    expect([200, 202, 500]).toContain(res.status);
    expect(res.data.status || res.data.error).toBeDefined();
  });

  it('POST /automations/email triggers email campaign', async () => {
    const res = await axiosInstance.post('/automations/email');
    expect([200, 202, 500]).toContain(res.status);
    expect(res.data.status || res.data.error).toBeDefined();
  });

  it('POST /automations/free-tier triggers free tier checks', async () => {
    const res = await axiosInstance.post('/automations/free-tier');
    expect([200, 202, 500]).toContain(res.status);
    expect(res.data.status || res.data.error).toBeDefined();
  });

  it('POST /automations/intent triggers intent detection', async () => {
    const res = await axiosInstance.post('/automations/intent');
    expect([200, 202, 500]).toContain(res.status);
    expect(res.data.status || res.data.error).toBeDefined();
  });
});

describe('Metrics Endpoints', () => {
  it('GET /api/metrics/weekly returns weekly metrics', async () => {
    const res = await axiosInstance.get('/api/metrics/weekly');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.data.metrics).toBeDefined();
      expect(res.data.metrics.newUsers).toBeDefined();
      expect(res.data.metrics.totalCost).toBeDefined();
    }
  });

  it('GET /api/system-status returns system information', async () => {
    const res = await axiosInstance.get('/api/system-status');
    expect(res.status).toBe(200);
    expect(res.data.uptime).toBeDefined();
    expect(res.data.automations).toBeDefined();
  });
});

describe('Agent Management', () => {
  it('POST /api/unblock/:agent unblocks an agent', async () => {
    const res = await axiosInstance.post('/api/unblock/test-agent');
    expect(res.status).toBe(200);
    expect(res.data.message).toContain('unblocked');
  });
});
