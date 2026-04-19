import { useState, useEffect } from 'react';
import '../styles/designSystem.css';

const DOC_CONTENT = {
  'quick-start': {
    title: 'Quick Start Guide',
    section: 'Getting Started',
    content: () => (
      <>
        <p>Get layeroi tracking your AI agent costs in under 15 minutes. No infrastructure changes required.</p>

        <h3>Prerequisites</h3>
        <ul>
          <li>An application using OpenAI, Anthropic, or any OpenAI-compatible LLM API</li>
          <li>A layeroi account (sign up free at <a href="/signup" style={{ color: '#22c55e' }}>layeroi.com/signup</a>)</li>
        </ul>

        <h3>Step 1: Get Your API Key</h3>
        <p>After signing up, your API key is generated instantly. It looks like <code>lr_live_abc123...</code></p>

        <h3>Step 2: Update Your SDK Configuration</h3>
        <p>Change one line in your existing code. Point your LLM SDK's base URL to layeroi's proxy:</p>

        <h4>Python (OpenAI SDK)</h4>
        <CodeBlock lang="python" code={`from openai import OpenAI

client = OpenAI(
    base_url="https://api.layeroi.com/v1",  # ← only change
    api_key="sk-your-openai-key",
    default_headers={
        "X-layeroi-Key": "lr_live_your_key",
        "X-Agent-Name": "sales-outreach-agent",
    }
)

# Use the client exactly as before
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
# Cost is now being tracked automatically`} />

        <h4>Node.js (OpenAI SDK)</h4>
        <CodeBlock lang="javascript" code={`import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.layeroi.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'X-layeroi-Key': 'lr_live_your_key',
    'X-Agent-Name': 'support-triage-agent',
  },
});

const completion = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
});`} />

        <h4>Python (Anthropic SDK)</h4>
        <CodeBlock lang="python" code={`import anthropic

client = anthropic.Anthropic(
    base_url="https://api.layeroi.com/anthropic/v1",
    api_key="sk-ant-your-key",
    default_headers={
        "X-layeroi-Key": "lr_live_your_key",
        "X-Agent-Name": "research-agent",
    }
)`} />

        <h3>Step 3: Verify It's Working</h3>
        <p>Make any API call through your agent. Within 30 seconds, you'll see the cost appear in your layeroi dashboard. The first data point confirms everything is connected correctly.</p>

        <InfoBox type="success" title="That's it!">
          Your agent is now being tracked. Every API call flows through layeroi's proxy (under 5ms overhead), and cost data populates your dashboard in real-time.
        </InfoBox>

        <h3>What Happens Next</h3>
        <ul>
          <li><strong>First hour:</strong> Individual API call costs appear in real-time</li>
          <li><strong>First day:</strong> Agent-level P&L begins to form with spend patterns</li>
          <li><strong>First week:</strong> Full ROI analysis, trend detection, and weekly CFO report generated</li>
          <li><strong>First month:</strong> Budget recommendations and optimization insights based on your data</li>
        </ul>
      </>
    ),
  },

  'installation': {
    title: 'Installation',
    section: 'Getting Started',
    content: () => (
      <>
        <p>layeroi requires zero infrastructure installation. It works as a transparent proxy — you change one environment variable and your agents are tracked.</p>

        <h3>Environment Variable Approach (Recommended)</h3>
        <p>The cleanest way to integrate is via environment variables so you can toggle tracking without code changes:</p>
        <CodeBlock lang="bash" code={`# .env or environment configuration
LAYEROI_KEY=lr_live_your_api_key
LLM_BASE_URL=https://api.layeroi.com/v1

# To disable layeroi temporarily, switch back:
# LLM_BASE_URL=https://api.openai.com/v1`} />

        <p>Then in your application code:</p>
        <CodeBlock lang="python" code={`import os
from openai import OpenAI

client = OpenAI(
    base_url=os.getenv("LLM_BASE_URL", "https://api.openai.com/v1"),
    api_key=os.getenv("OPENAI_API_KEY"),
    default_headers={
        "X-layeroi-Key": os.getenv("LAYEROI_KEY", ""),
        "X-Agent-Name": "my-agent",
    }
)`} />

        <h3>Supported Platforms</h3>
        <DataTable headers={['Platform', 'Base URL', 'Status']} rows={[
          ['OpenAI', 'https://api.layeroi.com/v1', '✓ Fully supported'],
          ['Anthropic', 'https://api.layeroi.com/anthropic/v1', '✓ Fully supported'],
          ['Google Gemini', 'https://api.layeroi.com/gemini/v1', '✓ Fully supported'],
          ['Azure OpenAI', 'https://api.layeroi.com/azure/v1', '✓ Fully supported'],
          ['OpenAI-compatible', 'https://api.layeroi.com/v1', '✓ Works automatically'],
        ]} />

        <h3>Failover Behavior</h3>
        <p>If layeroi's proxy is unreachable, your SDK will receive a connection error. To handle this gracefully, configure automatic failover:</p>
        <CodeBlock lang="python" code={`import os
from openai import OpenAI

LAYEROI_URL = "https://api.layeroi.com/v1"
DIRECT_URL = "https://api.openai.com/v1"

try:
    client = OpenAI(base_url=LAYEROI_URL, ...)
    # test connection
    client.models.list()
except Exception:
    # fallback to direct
    client = OpenAI(base_url=DIRECT_URL, ...)`} />

        <InfoBox type="info" title="99.97% uptime">
          Our proxy has maintained 99.97% uptime since launch. Failover is a safety net — you're unlikely to need it.
        </InfoBox>
      </>
    ),
  },

  'authentication': {
    title: 'Authentication',
    section: 'Getting Started',
    content: () => (
      <>
        <p>layeroi uses API keys for authentication. Every request through the proxy must include your layeroi API key in the headers.</p>

        <h3>API Key Format</h3>
        <p>layeroi API keys follow the format: <code>lr_live_</code> followed by 32 hex characters.</p>
        <CodeBlock lang="text" code={`lr_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`} />

        <h3>Header Authentication</h3>
        <p>Include your API key in every request via the <code>X-layeroi-Key</code> header:</p>
        <CodeBlock lang="bash" code={`curl https://api.layeroi.com/v1/chat/completions \\
  -H "Authorization: Bearer sk-your-openai-key" \\
  -H "X-layeroi-Key: lr_live_your_key" \\
  -H "X-Agent-Name: my-agent" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello"}]}'`} />

        <h3>Required Headers</h3>
        <DataTable headers={['Header', 'Required', 'Description']} rows={[
          ['X-layeroi-Key', 'Yes', 'Your layeroi API key'],
          ['X-Agent-Name', 'Yes', 'Unique name for this agent (used in P&L reports)'],
          ['X-Agent-Version', 'No', 'Version string for A/B testing agent costs'],
          ['X-Task-Name', 'No', 'Name of the specific task (for granular attribution)'],
          ['X-Business-Value', 'No', 'Expected revenue value of this call (for ROI calculation)'],
        ]} />

        <h3>Key Rotation</h3>
        <p>You can generate new API keys from your dashboard at any time. Old keys can be revoked immediately. We recommend rotating keys every 90 days.</p>

        <InfoBox type="warning" title="Security">
          Never commit API keys to source control. Use environment variables or a secrets manager. layeroi keys grant read access to your cost data and write access to tracking — treat them like any other secret.
        </InfoBox>
      </>
    ),
  },

  'openai': {
    title: 'OpenAI Integration',
    section: 'Integration Guides',
    content: () => (
      <>
        <p>layeroi supports all OpenAI models including GPT-4o, GPT-4 Turbo, GPT-3.5, o1, o3, and DALL-E. Integration takes one line.</p>

        <h3>Supported Models & Pricing</h3>
        <DataTable headers={['Model', 'Input (/1M tokens)', 'Output (/1M tokens)', 'Tracked']} rows={[
          ['gpt-4o', '$2.50', '$10.00', '✓'],
          ['gpt-4o-mini', '$0.15', '$0.60', '✓'],
          ['gpt-4-turbo', '$10.00', '$30.00', '✓'],
          ['o1', '$15.00', '$60.00', '✓'],
          ['o3-mini', '$1.10', '$4.40', '✓'],
          ['gpt-3.5-turbo', '$0.50', '$1.50', '✓'],
        ]} />

        <h3>Python Integration</h3>
        <CodeBlock lang="python" code={`from openai import OpenAI

client = OpenAI(
    base_url="https://api.layeroi.com/v1",
    api_key="sk-your-openai-key",
    default_headers={
        "X-layeroi-Key": "lr_live_your_key",
        "X-Agent-Name": "sales-agent",
    }
)

# Streaming works exactly the same
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Analyze this lead..."}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`} />

        <h3>Node.js Integration</h3>
        <CodeBlock lang="javascript" code={`import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.layeroi.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'X-layeroi-Key': process.env.LAYEROI_KEY,
    'X-Agent-Name': 'support-agent',
  },
});

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Triage this ticket...' }],
});`} />

        <h3>Function Calling & Tools</h3>
        <p>Function calling, tool use, JSON mode, and all other OpenAI features work identically through the proxy. layeroi tracks token usage for the full request including function definitions.</p>

        <h3>Embeddings & Image Generation</h3>
        <p>Embedding calls (<code>text-embedding-3-small</code>, etc.) and DALL-E image generation are also tracked automatically with accurate cost attribution.</p>
      </>
    ),
  },

  'anthropic': {
    title: 'Anthropic Integration',
    section: 'Integration Guides',
    content: () => (
      <>
        <p>Full support for all Claude models — Opus, Sonnet, and Haiku across Claude 3, 3.5, and 4 families.</p>

        <h3>Supported Models & Pricing</h3>
        <DataTable headers={['Model', 'Input (/1M tokens)', 'Output (/1M tokens)', 'Tracked']} rows={[
          ['claude-sonnet-4-6', '$3.00', '$15.00', '✓'],
          ['claude-opus-4-6', '$15.00', '$75.00', '✓'],
          ['claude-haiku-4-5', '$0.80', '$4.00', '✓'],
          ['claude-3.5-sonnet', '$3.00', '$15.00', '✓'],
          ['claude-3-opus', '$15.00', '$75.00', '✓'],
        ]} />

        <h3>Python Integration</h3>
        <CodeBlock lang="python" code={`import anthropic

client = anthropic.Anthropic(
    base_url="https://api.layeroi.com/anthropic/v1",
    api_key="sk-ant-your-key",
    default_headers={
        "X-layeroi-Key": "lr_live_your_key",
        "X-Agent-Name": "research-agent",
    }
)

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    messages=[{"role": "user", "content": "Analyze this dataset..."}]
)`} />

        <h3>Extended Thinking</h3>
        <p>Claude's extended thinking feature is fully supported. layeroi tracks both thinking tokens and output tokens separately, giving you accurate cost attribution for reasoning-heavy tasks.</p>
      </>
    ),
  },

  'agent-pnl': {
    title: 'Agent P&L',
    section: 'Core Concepts',
    content: () => (
      <>
        <p>Every agent in layeroi gets a real-time Profit & Loss statement — the same financial instrument your CFO uses for business units.</p>

        <h3>How P&L is Calculated</h3>
        <DataTable headers={['Component', 'Source', 'Example']} rows={[
          ['Revenue', 'X-Business-Value header or manual attribution', '$87,000/month'],
          ['Cost', 'Automatic: token usage × model pricing', '$12,400/month'],
          ['Gross Margin', 'Revenue - Cost', '$74,600/month'],
          ['ROI Multiple', 'Revenue / Cost', '7.0×'],
        ]} />

        <h3>Attribution Methods</h3>
        <p>layeroi supports three ways to attribute business value to agent calls:</p>

        <h4>1. Header-Based (Real-Time)</h4>
        <CodeBlock lang="python" code={`# Attach value per call
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    extra_headers={
        "X-Business-Value": "250.00",  # This call generated $250 in value
        "X-Task-Name": "lead-qualification",
    }
)`} />

        <h4>2. API-Based (Batch)</h4>
        <CodeBlock lang="bash" code={`# Report value after the fact via API
curl -X POST https://api.layeroi.com/api/v2/value \\
  -H "Authorization: Bearer lr_live_your_key" \\
  -d '{"agent": "sales-agent", "value": 15000, "period": "2026-04"}'`} />

        <h4>3. Integration-Based (Automatic)</h4>
        <p>Connect your CRM (Salesforce, HubSpot) or payment processor (Stripe) and layeroi will automatically attribute closed deals and revenue to the agents that generated them.</p>

        <h3>P&L Report Schedule</h3>
        <ul>
          <li><strong>Real-time:</strong> Dashboard updates every 30 seconds</li>
          <li><strong>Daily:</strong> Automated daily summary email (optional)</li>
          <li><strong>Weekly:</strong> Board-ready PDF report delivered Monday 9 AM</li>
          <li><strong>Monthly:</strong> Full P&L statement with trend analysis</li>
        </ul>
      </>
    ),
  },

  'budget-envelopes': {
    title: 'Budget Envelopes',
    section: 'Core Concepts',
    content: () => (
      <>
        <p>Budget envelopes let you set spending limits per agent. When an agent approaches its limit, layeroi automatically throttles or blocks further API calls.</p>

        <h3>How It Works</h3>
        <ol>
          <li>Set a monthly budget for each agent (e.g., $5,000/month for sales-agent)</li>
          <li>layeroi tracks spend in real-time against the budget</li>
          <li>At 80% utilization: warning alert sent via Slack/email</li>
          <li>At 95% utilization: automatic throttling (rate limit applied)</li>
          <li>At 100% utilization: agent blocked until next billing cycle or manual override</li>
        </ol>

        <h3>Configuration</h3>
        <CodeBlock lang="bash" code={`# Set budget via API
curl -X PUT https://api.layeroi.com/api/v2/budgets \\
  -H "Authorization: Bearer lr_live_your_key" \\
  -d '{
    "agent": "content-generation-v2",
    "monthly_limit": 5000,
    "alert_threshold": 0.8,
    "throttle_threshold": 0.95,
    "block_threshold": 1.0,
    "action_on_block": "reject_with_429"
  }'`} />

        <h3>Throttle Behavior</h3>
        <DataTable headers={['Threshold', 'Action', 'Agent Impact']} rows={[
          ['80%', 'Alert via Slack + email', 'None — informational only'],
          ['95%', 'Rate limit to 10 req/min', 'Agent slows down, does not stop'],
          ['100%', 'Block with HTTP 429', 'Agent receives "budget exhausted" error'],
          ['Manual override', 'Resume immediately', 'Admin can lift block at any time'],
        ]} />

        <InfoBox type="info" title="Soft vs Hard Limits">
          By default, limits are "soft" — they alert but don't block. Set <code>action_on_block: "reject_with_429"</code> to enable hard blocking. You can always override via the dashboard.
        </InfoBox>
      </>
    ),
  },

  'kill-switch': {
    title: 'Kill Switch',
    section: 'Core Concepts',
    content: () => (
      <>
        <p>The kill switch is layeroi's automatic protection against runaway agent loops — the #1 cause of unexpected AI bills.</p>

        <h3>The Problem</h3>
        <p>A single agent stuck in a recursive loop can burn $4,000+ in 90 minutes. Most teams don't discover these loops until the monthly invoice arrives. By then, the damage is done.</p>

        <h3>How Kill Switch Works</h3>
        <ol>
          <li><strong>Pattern Detection:</strong> layeroi monitors call frequency, token patterns, and cost velocity per agent in real-time</li>
          <li><strong>Anomaly Scoring:</strong> Each agent has a baseline. Deviations beyond 3 standard deviations trigger investigation</li>
          <li><strong>Automatic Response:</strong> When a runaway pattern is confirmed, the agent is blocked within 60 seconds</li>
          <li><strong>Alert & Report:</strong> You receive an immediate alert with the cost impact and root cause analysis</li>
        </ol>

        <h3>Detection Signals</h3>
        <DataTable headers={['Signal', 'Normal', 'Runaway Detected']} rows={[
          ['Calls per minute', '2-10', '50+ sustained'],
          ['Token velocity', '~5K/min', '100K+/min sustained'],
          ['Cost acceleration', 'Linear', 'Exponential'],
          ['Response similarity', 'Varied', '>90% identical responses'],
          ['Error rate', '<5%', '>30% with retries'],
        ]} />

        <h3>Response Time</h3>
        <p>From anomaly detection to agent block: <strong>under 60 seconds</strong>. The maximum cost exposure during detection is typically under $50, compared to $4,000+ without protection.</p>

        <InfoBox type="success" title="Automatic Protection">
          Kill switch is enabled by default on all plans. No configuration required. It works immediately when you connect your first agent.
        </InfoBox>
      </>
    ),
  },

  'rest-api': {
    title: 'REST API Reference',
    section: 'API Reference',
    content: () => (
      <>
        <p>The layeroi REST API gives you programmatic access to all cost data, agent metrics, and configuration.</p>

        <h3>Base URL</h3>
        <CodeBlock lang="text" code={`https://api.layeroi.com/api/v2`} />

        <h3>Authentication</h3>
        <CodeBlock lang="bash" code={`# All requests require Bearer auth
curl -H "Authorization: Bearer lr_live_your_key" \\
  https://api.layeroi.com/api/v2/agents`} />

        <h3>Endpoints</h3>

        <h4>GET /v2/agents</h4>
        <p>List all tracked agents with current metrics.</p>
        <CodeBlock lang="json" code={`{
  "status": "success",
  "data": {
    "agents": [
      {
        "name": "sales-outreach-agent",
        "total_cost": 12400.00,
        "total_calls": 48291,
        "total_tokens": 14720000,
        "roi": 7.0,
        "status": "profitable",
        "last_active": "2026-04-18T13:45:00Z"
      }
    ]
  }
}`} />

        <h4>GET /v2/costs</h4>
        <p>Aggregate cost data with optional filters.</p>
        <CodeBlock lang="bash" code={`# Get costs for a specific agent and date range
curl "https://api.layeroi.com/api/v2/costs?agent=sales-agent&from=2026-04-01&to=2026-04-18" \\
  -H "Authorization: Bearer lr_live_your_key"`} />

        <h4>GET /v2/reports/weekly</h4>
        <p>Generate a weekly P&L report.</p>

        <h4>POST /v2/budgets</h4>
        <p>Create or update budget envelopes.</p>

        <h4>GET /v2/alerts</h4>
        <p>List recent alerts (budget warnings, kill switch activations).</p>

        <h3>Rate Limits</h3>
        <DataTable headers={['Plan', 'Requests/min', 'Requests/day']} rows={[
          ['Starter', '60', '10,000'],
          ['Business', '300', '100,000'],
          ['Enterprise', '1,000', 'Unlimited'],
        ]} />
      </>
    ),
  },

  'webhooks': {
    title: 'Webhooks',
    section: 'API Reference',
    content: () => (
      <>
        <p>Receive real-time notifications when important events occur in your layeroi account.</p>

        <h3>Supported Events</h3>
        <DataTable headers={['Event', 'Trigger', 'Payload Includes']} rows={[
          ['budget.warning', 'Agent reaches 80% of budget', 'Agent name, current spend, limit'],
          ['budget.exceeded', 'Agent reaches 100% of budget', 'Agent name, total spend, action taken'],
          ['killswitch.activated', 'Runaway loop detected and blocked', 'Agent name, cost saved, pattern details'],
          ['agent.anomaly', 'Unusual spending pattern detected', 'Agent name, anomaly score, baseline comparison'],
          ['report.generated', 'Weekly/monthly report is ready', 'Report URL, summary metrics'],
        ]} />

        <h3>Webhook Configuration</h3>
        <CodeBlock lang="bash" code={`curl -X POST https://api.layeroi.com/api/v2/webhooks \\
  -H "Authorization: Bearer lr_live_your_key" \\
  -d '{
    "url": "https://your-app.com/webhooks/layeroi",
    "events": ["budget.warning", "killswitch.activated"],
    "secret": "whsec_your_signing_secret"
  }'`} />

        <h3>Payload Format</h3>
        <CodeBlock lang="json" code={`{
  "event": "killswitch.activated",
  "timestamp": "2026-04-18T14:32:00Z",
  "data": {
    "agent": "content-generation-v2",
    "reason": "recursive_loop_detected",
    "calls_blocked": 847,
    "cost_saved": "$2,340.00",
    "pattern": "identical_responses_detected",
    "action": "agent_blocked"
  }
}`} />

        <h3>Slack Integration</h3>
        <p>For Slack notifications, use our native integration instead of webhooks. Go to Dashboard → Settings → Integrations → Slack and connect your workspace. Alerts will be posted to your chosen channel automatically.</p>
      </>
    ),
  },

  'sso-saml': {
    title: 'SSO / SAML',
    section: 'Configuration',
    content: () => (
      <>
        <p>Enterprise plan includes SSO via SAML 2.0. Supported identity providers include Okta, Azure AD, Google Workspace, and OneLogin.</p>

        <h3>Configuration Steps</h3>
        <ol>
          <li>Navigate to Dashboard → Settings → Security → SSO</li>
          <li>Select your identity provider</li>
          <li>Enter your SAML metadata URL or upload the XML</li>
          <li>Map user attributes (email, name, role)</li>
          <li>Test the connection with a single user</li>
          <li>Enable for all users and disable password login</li>
        </ol>

        <h3>Supported Providers</h3>
        <DataTable headers={['Provider', 'Protocol', 'Status']} rows={[
          ['Okta', 'SAML 2.0', '✓ Fully supported'],
          ['Azure AD', 'SAML 2.0 / OIDC', '✓ Fully supported'],
          ['Google Workspace', 'SAML 2.0', '✓ Fully supported'],
          ['OneLogin', 'SAML 2.0', '✓ Fully supported'],
          ['Custom SAML', 'SAML 2.0', '✓ Any compliant IdP'],
        ]} />

        <InfoBox type="info" title="Automatic Provisioning">
          SSO activates automatically when you sign up for the Enterprise plan ($8,500/month). No sales call or manual setup required.
        </InfoBox>
      </>
    ),
  },
};

const DOC_NAV = [
  {
    section: 'Getting Started',
    items: [
      { id: 'quick-start', name: 'Quick Start Guide', tag: 'START HERE' },
      { id: 'installation', name: 'Installation' },
      { id: 'authentication', name: 'Authentication' },
    ],
  },
  {
    section: 'Integration Guides',
    items: [
      { id: 'openai', name: 'OpenAI SDK' },
      { id: 'anthropic', name: 'Anthropic SDK' },
    ],
  },
  {
    section: 'Core Concepts',
    items: [
      { id: 'agent-pnl', name: 'Agent P&L' },
      { id: 'budget-envelopes', name: 'Budget Envelopes' },
      { id: 'kill-switch', name: 'Kill Switch' },
    ],
  },
  {
    section: 'API Reference',
    items: [
      { id: 'rest-api', name: 'REST API' },
      { id: 'webhooks', name: 'Webhooks' },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { id: 'sso-saml', name: 'SSO / SAML' },
    ],
  },
];

export default function Docs() {
  const [activePage, setActivePage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/docs\/(.+)$/);
    if (match && DOC_CONTENT[match[1]]) {
      setActivePage(match[1]);
    }
  }, []);

  const navigateTo = (id) => {
    setActivePage(id);
    setSidebarOpen(false);
    window.history.pushState(null, '', `/docs/${id}`);
    window.scrollTo(0, 0);
  };

  const goToIndex = () => {
    setActivePage(null);
    setSidebarOpen(false);
    window.history.pushState(null, '', '/docs');
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handler = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/docs\/(.+)$/);
      setActivePage(match && DOC_CONTENT[match[1]] ? match[1] : null);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return (
    <div className="landing-root" style={{ minHeight: '100vh' }}>
      <DocsNav goToIndex={goToIndex} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div style={{ display: 'flex', paddingTop: '64px', minHeight: '100vh' }}>
        {/* Sidebar — desktop always visible, mobile overlay */}
        <aside className="docs-sidebar" style={{
          width: '260px', flexShrink: 0,
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--surface-0)',
          position: 'fixed', top: '64px', bottom: 0, left: 0,
          overflowY: 'auto', padding: '24px 0',
          zIndex: 50,
        }}>
          <DocsSidebar nav={DOC_NAV} active={activePage} onNavigate={navigateTo} />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49 }} onClick={() => setSidebarOpen(false)} />
            <aside style={{
              position: 'fixed', top: '64px', bottom: 0, left: 0,
              width: '280px', background: 'var(--surface-0)',
              borderRight: '1px solid var(--border-subtle)',
              overflowY: 'auto', padding: '24px 0', zIndex: 51,
              animation: 'fadeIn 200ms ease',
            }}>
              <DocsSidebar nav={DOC_NAV} active={activePage} onNavigate={navigateTo} />
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="docs-main" style={{ flex: 1, marginLeft: '260px', padding: '48px 64px', maxWidth: '860px' }}>
          {activePage && DOC_CONTENT[activePage] ? (
            <DocPage page={DOC_CONTENT[activePage]} onNavigate={navigateTo} />
          ) : (
            <DocsIndex onNavigate={navigateTo} />
          )}
        </main>
      </div>

      <style>{`
        .docs-content h3 { font-size: 20px; font-weight: 600; color: white; margin: 32px 0 12px; letter-spacing: -0.01em; }
        .docs-content h4 { font-size: 16px; font-weight: 600; color: var(--white-90); margin: 24px 0 8px; }
        .docs-content p { font-size: 15px; color: var(--white-70); line-height: 1.7; margin-bottom: 16px; }
        .docs-content ul, .docs-content ol { padding-left: 20px; margin-bottom: 16px; }
        .docs-content li { font-size: 15px; color: var(--white-70); line-height: 1.7; margin-bottom: 6px; }
        .docs-content code { font-family: 'JetBrains Mono', monospace; font-size: 13px; background: var(--surface-2); padding: 2px 6px; border-radius: 4px; color: #4ade80; }
        .docs-content a { color: #22c55e; text-decoration: none; }
        .docs-content a:hover { text-decoration: underline; }
        .docs-content strong { color: var(--white-90); }
        @media (max-width: 1023px) {
          .docs-sidebar { display: none !important; }
          .docs-main { margin-left: 0 !important; padding: 32px 20px !important; }
        }
      `}</style>
    </div>
  );
}

function DocsNav({ goToIndex, onMenuToggle }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '64px', background: 'rgba(5,5,5,0.85)',
      backdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px' }}>
        <button onClick={onMenuToggle} className="docs-menu-btn" style={{
          display: 'none', background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: '8px',
        }}>☰</button>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#22c55e"/><rect x="5" y="7" width="3" height="11" rx="1" fill="white"/><rect x="10.5" y="10" width="3" height="8" rx="1" fill="white" opacity="0.75"/><rect x="16" y="5" width="3" height="13" rx="1" fill="white" opacity="0.9"/></svg>
          <span style={{ fontWeight: 600, fontSize: '15px', color: 'white' }}>layer<span style={{ color: '#22c55e' }}>oi</span></span>
        </a>
        <span style={{ color: 'var(--white-35)' }}>/</span>
        <button onClick={goToIndex} style={{ background: 'none', border: 'none', color: 'var(--white-70)', fontSize: '14px', cursor: 'pointer' }}>Docs</button>
        <div style={{ flex: 1 }} />
        <a href="/signup" className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>Start free →</a>
      </div>
      <style>{`@media (max-width: 1023px) { .docs-menu-btn { display: block !important; } }`}</style>
    </nav>
  );
}

function DocsSidebar({ nav, active, onNavigate }) {
  return (
    <div>
      {nav.map(group => (
        <div key={group.section} style={{ marginBottom: '24px' }}>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--white-35)', letterSpacing: '0.1em', padding: '0 24px', marginBottom: '8px' }}>
            {group.section.toUpperCase()}
          </div>
          {group.items.map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '8px 24px', background: active === item.id ? 'rgba(34,197,94,0.08)' : 'transparent',
              border: 'none', borderLeft: active === item.id ? '2px solid #22c55e' : '2px solid transparent',
              color: active === item.id ? '#22c55e' : 'var(--white-70)',
              fontSize: '13px', fontWeight: active === item.id ? 600 : 400,
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 150ms ease',
            }}>
              {item.name}
              {item.tag && <span className="mono" style={{ fontSize: '8px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.06em' }}>{item.tag}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function DocsIndex({ onNavigate }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: '11px', color: '#22c55e', letterSpacing: '0.1em', marginBottom: '16px' }}>DOCUMENTATION</div>
      <h1 className="serif" style={{ fontSize: 'var(--type-h1)', color: 'white', lineHeight: 1.1, marginBottom: '16px' }}>
        Everything you need to integrate layeroi.
      </h1>
      <p style={{ fontSize: 'var(--type-body-lg)', color: 'var(--white-50)', lineHeight: 1.6, marginBottom: '48px' }}>
        Most teams are live in under 15 minutes. Start with the Quick Start Guide.
      </p>

      {DOC_NAV.map(group => (
        <div key={group.section} style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>{group.section}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {group.items.map(item => (
              <button key={item.id} onClick={() => onNavigate(item.id)} style={{
                background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                borderRadius: '8px', padding: '20px', textAlign: 'left',
                cursor: 'pointer', transition: 'all 200ms var(--ease-out)', width: '100%',
              }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                 onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{item.name}</span>
                  {item.tag && <span className="mono" style={{ fontSize: '9px', color: '#22c55e', background: 'rgba(34,197,94,0.08)', padding: '2px 8px', borderRadius: '100px', letterSpacing: '0.06em' }}>{item.tag}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DocPage({ page }) {
  return (
    <div className="docs-content">
      <div className="mono" style={{ fontSize: '11px', color: 'var(--white-35)', letterSpacing: '0.08em', marginBottom: '8px' }}>{page.section}</div>
      <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginBottom: '32px', letterSpacing: '-0.02em' }}>{page.title}</h1>
      {page.content()}
    </div>
  );
}

function CodeBlock({ code, lang }) {
  return (
    <div style={{
      background: '#050505', border: '1px solid var(--border-subtle)',
      borderRadius: '8px', padding: '16px', marginBottom: '20px',
      overflow: 'auto', position: 'relative',
    }}>
      {lang && <div className="mono" style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '10px', color: 'var(--white-35)', letterSpacing: '0.06em' }}>{lang.toUpperCase()}</div>}
      <pre className="mono" style={{ margin: 0, fontSize: '13px', color: 'var(--white-70)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{code}</pre>
    </div>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div style={{ overflow: 'auto', marginBottom: '20px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
            {headers.map(h => <th key={h} className="mono" style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', color: 'var(--white-35)', letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              {row.map((cell, j) => <td key={j} style={{ padding: '10px 14px', color: j === 0 ? 'var(--white-90)' : 'var(--white-70)', fontWeight: j === 0 ? 500 : 400 }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoBox({ type, title, children }) {
  const colors = {
    info: { border: 'rgba(59,130,246,0.3)', bg: 'rgba(59,130,246,0.05)', accent: '#3b82f6' },
    success: { border: 'rgba(34,197,94,0.3)', bg: 'rgba(34,197,94,0.05)', accent: '#22c55e' },
    warning: { border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.05)', accent: '#f59e0b' },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: c.accent, marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '14px', color: 'var(--white-70)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}
