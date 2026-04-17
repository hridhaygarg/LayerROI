import express from 'express';

const router = express.Router();

router.get('/docs', (req, res) => {
  const htmlDocs = `
<!DOCTYPE html>
<html>
<head>
  <title>layeroi API Documentation</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; max-width: 900px; }
    h1 { color: #333; }
    .endpoint { background: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc; }
    .method { display: inline-block; padding: 5px 10px; background: #0066cc; color: white; border-radius: 3px; }
    code { background: #eee; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>layeroi API Documentation</h1>

  <h2>Authentication</h2>
  <p>Use JWT Bearer tokens or API keys:</p>
  <ul>
    <li><code>Authorization: Bearer YOUR_JWT_TOKEN</code></li>
    <li><code>X-API-Key: YOUR_API_KEY</code></li>
  </ul>

  <h2>Endpoints</h2>

  <div class="endpoint">
    <span class="method">GET</span> <code>/v2/agents</code>
    <p>List all agents for your organization</p>
  </div>

  <div class="endpoint">
    <span class="method">GET</span> <code>/v2/costs</code>
    <p>Get cost breakdown for all agents (30 days)</p>
  </div>

  <div class="endpoint">
    <span class="method">GET</span> <code>/v2/costs/:agent</code>
    <p>Get costs for specific agent</p>
  </div>

  <div class="endpoint">
    <span class="method">POST</span> <code>/v1/chat/completions</code>
    <p>Send chat completion request (OpenAI compatible)</p>
  </div>

  <div class="endpoint">
    <span class="method">GET</span> <code>/v2/openapi.json</code>
    <p>Get OpenAPI 3.0 specification</p>
  </div>

  <h2>Examples</h2>
  <pre>
# Get your agents
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.layeroi.com/v2/agents

# Check costs
curl -H "X-API-Key: YOUR_KEY" https://api.layeroi.com/v2/costs

# Send LLM request
curl -X POST https://api.layeroi.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "X-Agent-Name: my-agent" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
  </pre>

  <h2>Response Format</h2>
  <pre>
{
  "status": "success|error",
  "data": { ... },
  "error": null,
  "timestamp": "2026-04-14T10:00:00Z"
}
  </pre>
</body>
</html>
  `;
  res.set('Content-Type', 'text/html');
  res.send(htmlDocs);
});

router.get('/docs/api', (req, res) => {
  res.json({
    title: 'layeroi API v2',
    version: '2.0.0',
    baseUrl: 'https://api.layeroi.com',
    endpoints: {
      agents: { GET: '/v2/agents' },
      costs: {
        GET: ['/v2/costs', '/v2/costs/:agent'],
      },
      auth: {
        POST: ['/auth/login', '/auth/signup', '/auth/google/token'],
      },
      insights: {
        GET: '/api/insights',
        POST: '/api/insights/generate',
      },
      forecasts: {
        GET: '/api/forecasts',
        POST: '/api/forecasts/generate',
      },
      webhooks: {
        GET: '/api/webhooks',
        POST: '/api/webhooks',
        DELETE: '/api/webhooks/:id',
      },
    },
  });
});

export default router;
