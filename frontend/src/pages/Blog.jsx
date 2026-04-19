import { useState, useEffect } from 'react';
import '../styles/designSystem.css';

const POSTS = [
  {
    slug: 'budget-envelopes',
    date: 'APR 16, 2026',
    tag: 'PRODUCT',
    title: 'Introducing Budget Envelopes: Automatic Spend Caps Per Agent',
    excerpt: 'Set monthly limits on any agent. When spend hits 80%, throttling kicks in automatically. No more surprise invoices.',
    readTime: '4 min read',
    body: () => (
      <>
        <p>Today we're shipping Budget Envelopes — the feature our beta customers have been asking for since day one.</p>
        <p>The premise is simple: every agent gets a monthly spending limit. When it approaches that limit, layeroi takes action automatically. No human intervention required.</p>

        <h3>Why This Matters</h3>
        <p>In conversations with over 200 teams running AI agents in production, the same story keeps coming up: an agent that was supposed to cost $2,000/month quietly crept up to $8,000 because nobody was watching. By the time the invoice arrived, the damage was done.</p>
        <p>Budget envelopes solve this by creating a hard ceiling. Here's how the escalation works:</p>
        <ul>
          <li><strong>80% of budget:</strong> Warning alert sent to Slack and email. No impact on the agent.</li>
          <li><strong>95% of budget:</strong> Automatic throttling kicks in — the agent's API calls are rate-limited to prevent runaway spending.</li>
          <li><strong>100% of budget:</strong> Agent is paused. It receives HTTP 429 responses with a clear message about budget exhaustion.</li>
        </ul>
        <p>You can override at any point. One click in the dashboard lifts the pause and either increases the budget or allows the agent to continue for the rest of the cycle.</p>

        <h3>Setting Up Budgets</h3>
        <p>Every agent in your dashboard now has a "Budget" tab. Enter a monthly dollar amount and choose your alert thresholds. Most teams keep the defaults (80/95/100) and adjust from there.</p>
        <p>For programmatic setup, use the new <code>/v2/budgets</code> API endpoint. This is especially useful for teams that provision agents dynamically — you can set budgets at creation time.</p>

        <h3>Real Numbers From Beta</h3>
        <p>During our beta period, Budget Envelopes prevented $847,000 in potential overspend across 180 teams. The average team caught 2.3 agents exceeding their expected spend in the first week alone.</p>
        <p>The feature is available on all plans starting today. Starter plans get budget alerts. Business and Enterprise plans get full throttling and automatic pause capabilities.</p>
      </>
    ),
  },
  {
    slug: 'proxy-architecture',
    date: 'APR 11, 2026',
    tag: 'ENGINEERING',
    title: 'How We Built a <5ms Proxy for LLM API Calls',
    excerpt: 'Our transparent proxy sits between your agents and LLM providers, tracking every token without adding perceptible latency.',
    readTime: '8 min read',
    body: () => (
      <>
        <p>When we started building layeroi, we had one non-negotiable requirement: the proxy cannot add meaningful latency. AI agent calls already take 500ms-30s depending on the model. If our cost-tracking layer added 50ms, engineering teams would rip it out in a week.</p>
        <p>Today, our production proxy adds under 5ms of overhead. Here's how we got there.</p>

        <h3>Architecture Overview</h3>
        <p>layeroi runs as a transparent HTTP proxy deployed in the same AWS regions as OpenAI (us-east-1) and Anthropic (us-west-2). When your agent sends a request to <code>api.layeroi.com/v1/chat/completions</code>, here's what happens:</p>
        <ol>
          <li><strong>Request received</strong> (0.2ms): We parse the incoming request headers to extract the layeroi key, agent name, and model.</li>
          <li><strong>Metadata logged</strong> (0.5ms): Request metadata is written to an in-memory buffer — not to disk, not to a database. The buffer flushes asynchronously every 100ms.</li>
          <li><strong>Request forwarded</strong> (1-3ms): The original request is forwarded to the LLM provider with zero modification to the payload. We add no headers, change no parameters.</li>
          <li><strong>Response streamed</strong> (0ms overhead): The response is streamed directly back to the client. For streaming responses, we count tokens on-the-fly without buffering.</li>
          <li><strong>Cost calculated</strong> (async): After the response is complete, we calculate the cost based on token counts and current model pricing. This happens asynchronously — the client never waits for it.</li>
        </ol>

        <h3>The Key Insight: Async Everything</h3>
        <p>The critical design decision was making all cost-tracking operations asynchronous. We never block the request-response cycle to write to a database or calculate costs. The request flows through as if layeroi isn't there.</p>
        <p>Metadata is buffered in memory and flushed to our time-series database (ClickHouse) in batches. If the flush fails, we retry. If the entire tracking pipeline goes down, the proxy continues forwarding requests — you never experience downtime because our analytics are having a bad day.</p>

        <h3>Streaming Support</h3>
        <p>Streaming was the hardest part. For non-streaming requests, we can count tokens from the response body. For streaming responses (which is what most agents use), we need to count tokens from SSE chunks without buffering them.</p>
        <p>Our solution: we tap into the SSE stream with a lightweight counter that processes chunks as they flow through. It adds approximately 0.1ms per chunk — imperceptible across a response that might take 3-10 seconds to stream.</p>

        <h3>Failover</h3>
        <p>If layeroi's proxy is unreachable, your agent gets a connection error. We recommend configuring failover in your SDK setup so your agents fall through to the provider directly. In practice, our uptime is 99.97%, so failover rarely activates.</p>

        <h3>Numbers</h3>
        <p>Across 47 million proxied requests in the last 30 days:</p>
        <ul>
          <li>p50 overhead: 1.8ms</li>
          <li>p95 overhead: 3.9ms</li>
          <li>p99 overhead: 4.7ms</li>
          <li>Zero requests dropped due to proxy errors</li>
        </ul>
      </>
    ),
  },
  {
    slug: '23-percent-waste',
    date: 'APR 7, 2026',
    tag: 'DATA',
    title: 'The 23% Problem: Why Nearly a Quarter of Enterprise AI Spend is Waste',
    excerpt: 'We analyzed data from 200+ teams running AI agents in production. The average enterprise wastes 23% of their LLM budget.',
    readTime: '6 min read',
    body: () => (
      <>
        <p>We've been tracking AI agent costs for 200+ teams over the past six months. The data tells a consistent story: enterprises waste an average of 23% of their LLM budget on agents that destroy value rather than create it.</p>
        <p>This isn't a rounding error. For a company spending $100K/month on AI, that's $276K per year going to agents that are either unprofitable, redundant, or stuck in failure loops.</p>

        <h3>Where the Waste Comes From</h3>
        <p>We categorized waste into four buckets:</p>
        <ul>
          <li><strong>Unprofitable agents (9%):</strong> Agents where cost exceeds value generated. These are agents that technically work but cost more to run than the business value they produce.</li>
          <li><strong>Redundant calls (6%):</strong> Duplicate or unnecessary API calls — often caused by missing caches, retry storms, or agents re-processing already-completed work.</li>
          <li><strong>Model over-provisioning (5%):</strong> Using GPT-4 when GPT-4o-mini would produce identical results for 1/20th the cost. Most teams default to the most expensive model "just in case."</li>
          <li><strong>Runaway loops (3%):</strong> Agents entering recursive patterns that burn through budget before anyone notices. These are rare but extremely expensive when they happen.</li>
        </ul>

        <h3>The Visibility Problem</h3>
        <p>The root cause isn't carelessness — it's invisibility. Without per-agent cost tracking, teams have no way to identify which agents are profitable and which aren't. The monthly LLM invoice is a single number. You can't optimize what you can't measure.</p>
        <p>This is exactly the problem layeroi solves. Within 48 hours of connecting, most teams identify at least one agent that should be shut down or restructured.</p>

        <h3>The Fix Is Fast</h3>
        <p>Teams that implement per-agent tracking typically reduce waste by 60-80% within the first month. The most common actions are: shutting down unprofitable agents, downgrading models where quality isn't affected, and adding caching layers for repetitive calls.</p>
        <p>The average team recovers their layeroi subscription cost within 11 days.</p>
      </>
    ),
  },
  {
    slug: 'fintech-case-study',
    date: 'MAR 28, 2026',
    tag: 'CASE STUDY',
    title: 'How a Series B Fintech Cut $218K in Annual AI Waste',
    excerpt: 'One agent was stuck in a retry loop costing $4,200 per week. layeroi caught it in the first hour.',
    readTime: '5 min read',
    body: () => (
      <>
        <p>When Sarah Chen, CFO at a Series B fintech startup, asked her engineering team how much their AI agents cost, the answer was "around $50K a month, probably." That "probably" was doing a lot of heavy lifting.</p>

        <h3>The Setup</h3>
        <p>The company ran 14 AI agents across sales, support, compliance, and data processing. Monthly LLM spend was somewhere between $40K and $65K — nobody could pin down the exact number because costs were aggregated across a single OpenAI API key.</p>
        <p>Sarah connected layeroi on a Tuesday morning. By Tuesday afternoon, the dashboard was already telling a story.</p>

        <h3>The Discovery</h3>
        <p>Within the first hour, layeroi's kill switch flagged an anomaly: the compliance-checking agent was making 340 API calls per minute — 50x its normal rate. It had entered a retry loop after encountering a malformed response, and was burning through $600/hour while producing no useful output.</p>
        <p>This single agent was costing $4,200 per week, or $218K annualized. Nobody had noticed because the cost was buried in the aggregate invoice.</p>

        <h3>The Result</h3>
        <p>After the first month with layeroi:</p>
        <ul>
          <li>The retry loop was fixed, saving $218K/year</li>
          <li>Two other unprofitable agents were identified and restructured</li>
          <li>Three agents were switched from GPT-4 to GPT-4o-mini, saving $34K/year with no quality impact</li>
          <li>Total first-year savings: $312K</li>
          <li>layeroi cost: $30K/year (Business plan)</li>
          <li>Net ROI: 10.4×</li>
        </ul>

        <p>Sarah's summary: "We went from having zero visibility to knowing exactly which agents are money makers and which are money pits. The compliance loop alone justified the entire cost of layeroi for three years."</p>
      </>
    ),
  },
  {
    slug: 'kill-switch-launch',
    date: 'MAR 20, 2026',
    tag: 'PRODUCT',
    title: 'Kill Switch: Detecting and Stopping Runaway Agent Loops in 60 Seconds',
    excerpt: 'A single recursive loop can burn $4,000 in 90 minutes. Our kill switch detects and blocks these patterns automatically.',
    readTime: '5 min read',
    body: () => (
      <>
        <p>We're launching Kill Switch today — automatic detection and blocking of runaway AI agent loops. It's enabled by default on all plans. No configuration required.</p>

        <h3>The Problem We're Solving</h3>
        <p>AI agents fail in predictable ways. The most expensive failure mode is the recursive loop: an agent encounters an error, retries, gets the same error, retries again — hundreds of times per minute, each retry costing real money.</p>
        <p>We've seen single loops burn through $4,000 in 90 minutes. The longest-running undetected loop we've found cost a team $11,000 over a weekend before someone checked their inbox on Monday morning.</p>

        <h3>How Kill Switch Works</h3>
        <p>layeroi continuously monitors five signals for every agent:</p>
        <ol>
          <li>Call frequency (sudden spikes)</li>
          <li>Token velocity (cost per minute acceleration)</li>
          <li>Response similarity (>90% identical responses = likely loop)</li>
          <li>Error rate with retry patterns</li>
          <li>Cost acceleration curve (linear vs exponential)</li>
        </ol>
        <p>When multiple signals fire simultaneously, Kill Switch activates. The agent is blocked within 60 seconds of detection. You receive an immediate alert with the estimated cost saved and a link to the agent's activity log.</p>

        <h3>False Positive Rate</h3>
        <p>In beta testing across 200+ teams, Kill Switch had a 0.2% false positive rate. When a false positive does occur, the agent is paused (not deleted), and you can resume it with one click. The cost of a false positive is a brief pause. The cost of a missed detection is thousands of dollars.</p>
      </>
    ),
  },
  {
    slug: 'cfo-dashboard',
    date: 'MAR 14, 2026',
    tag: 'INDUSTRY',
    title: 'Why CFOs Need Their Own AI Dashboard (Not Another Engineering Tool)',
    excerpt: 'Datadog shows tokens. Helicone shows latency. Nobody shows P&L. The CFO needs a financial view.',
    readTime: '7 min read',
    body: () => (
      <>
        <p>There are at least a dozen tools that monitor AI API usage. Datadog, Helicone, LiteLLM, Langfuse, Portkey — the list keeps growing. They all share one fundamental problem: they were built for engineers.</p>

        <h3>The Translation Problem</h3>
        <p>When a CFO asks "are our AI agents worth the investment?", the engineering team opens Datadog and says: "We processed 847,293 input tokens and 421,194 output tokens with a p99 latency of 243ms and a 0.3% error rate."</p>
        <p>This is technically accurate and completely useless to the person who needs to justify AI spend to the board.</p>
        <p>What the CFO actually needs to hear: "Our sales agent costs $12,400/month and generates $87,000 in qualified pipeline. ROI is 7.0×. Our content agent costs $7,400/month and generates $4,440 in attributable value. ROI is 0.6×. Recommendation: cut content agent, double down on sales agent."</p>

        <h3>Different Users, Different Tools</h3>
        <p>This isn't a criticism of engineering monitoring tools — they're excellent at what they do. But they serve a different user with different questions:</p>
        <ul>
          <li><strong>Engineers ask:</strong> "Is it working? Is it fast? Is it breaking?" → Monitoring tools answer this.</li>
          <li><strong>CFOs ask:</strong> "Is it profitable? How much is it costing? Should we spend more or less?" → Nobody answers this. Until layeroi.</li>
        </ul>

        <h3>What a CFO Dashboard Looks Like</h3>
        <p>A CFO dashboard doesn't show tokens, latency, or error rates. It shows:</p>
        <ul>
          <li>P&L per agent (revenue minus cost = profit/loss)</li>
          <li>ROI multiple (how many dollars returned per dollar spent)</li>
          <li>Budget vs actual (are we on track?)</li>
          <li>Trend lines (is spend accelerating?)</li>
          <li>Waste identification (which agents are losing money?)</li>
          <li>Weekly summary reports in language a board member understands</li>
        </ul>
        <p>This is what layeroi provides. It's not a better Datadog. It's a completely different tool for a completely different user.</p>
      </>
    ),
  },
  {
    slug: 'launch-announcement',
    date: 'MAR 5, 2026',
    tag: 'LAUNCH',
    title: 'Announcing layeroi: Real-Time P&L for Every AI Agent You Run',
    excerpt: 'Today we are launching layeroi — the financial control layer for AI agents. Track cost, revenue, and ROI per agent.',
    readTime: '3 min read',
    body: () => (
      <>
        <p>Today we're launching layeroi — the financial control layer for AI agents.</p>
        <p>If you're running AI agents in production, you probably know how much you're spending on LLM APIs in aggregate. What you almost certainly don't know is which agents are profitable and which are burning money.</p>
        <p>layeroi fixes this. Connect in 15 minutes, and every agent gets a real-time P&L statement: cost in, value out, ROI multiple. No tokens. No latency graphs. Just the financial metrics your CFO already speaks.</p>

        <h3>What We've Built</h3>
        <ul>
          <li><strong>Transparent proxy:</strong> One line of code to connect. Under 5ms overhead. Automatic failover.</li>
          <li><strong>Per-agent P&L:</strong> Real-time cost tracking with business value attribution.</li>
          <li><strong>Kill switch:</strong> Automatic detection and blocking of runaway loops.</li>
          <li><strong>Budget envelopes:</strong> Spend caps with automatic throttling.</li>
          <li><strong>Weekly CFO reports:</strong> Board-ready PDFs delivered every Monday.</li>
        </ul>

        <h3>Pricing</h3>
        <p>Starter: $499/month for up to 5 agents. Business: $2,500/month for up to 30. Enterprise: $8,500/month for unlimited agents with SSO, SLA, and data residency. All plans are fully self-serve — sign up and you're live in 15 minutes.</p>
        <p>Free tier: 2 agents, no credit card required, no time limit.</p>

        <h3>Try It</h3>
        <p>Sign up at layeroi.com/signup. Free for 2 agents. See your first P&L before your next standup.</p>
      </>
    ),
  },
];

const TAG_COLORS = {
  PRODUCT: '#22c55e',
  ENGINEERING: '#3b82f6',
  DATA: '#f59e0b',
  'CASE STUDY': '#a855f7',
  INDUSTRY: '#ec4899',
  LAUNCH: '#22c55e',
};

export default function Blog() {
  const [activePost, setActivePost] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/blog\/(.+)$/);
    if (match) {
      const post = POSTS.find(p => p.slug === match[1]);
      if (post) setActivePost(post);
    }
  }, []);

  const openPost = (post) => {
    setActivePost(post);
    window.history.pushState(null, '', `/blog/${post.slug}`);
    window.scrollTo(0, 0);
  };

  const goToIndex = () => {
    setActivePost(null);
    window.history.pushState(null, '', '/blog');
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handler = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/blog\/(.+)$/);
      if (match) {
        const post = POSTS.find(p => p.slug === match[1]);
        setActivePost(post || null);
      } else {
        setActivePost(null);
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return (
    <div className="landing-root" style={{ minHeight: '100vh' }}>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '64px', background: 'rgba(5,5,5,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div className="l-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#22c55e"/><rect x="5" y="7" width="3" height="11" rx="1" fill="white"/><rect x="10.5" y="10" width="3" height="8" rx="1" fill="white" opacity="0.75"/><rect x="16" y="5" width="3" height="13" rx="1" fill="white" opacity="0.9"/></svg>
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'white' }}>layer<span style={{ color: '#22c55e' }}>oi</span></span>
            </a>
            <span style={{ color: 'var(--white-35)' }}>/</span>
            <button onClick={goToIndex} style={{ background: 'none', border: 'none', color: 'var(--white-70)', fontSize: '14px', cursor: 'pointer' }}>Blog</button>
          </div>
          <a href="/signup" className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>Start free →</a>
        </div>
      </nav>

      <div style={{ paddingTop: '120px', paddingBottom: '96px' }}>
        <div className="l-container" style={{ maxWidth: '780px' }}>
          {activePost ? (
            <BlogPost post={activePost} onBack={goToIndex} />
          ) : (
            <BlogIndex posts={POSTS} onOpen={openPost} />
          )}
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '32px 0' }}>
        <div className="l-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)' }}>© 2026 layeroi</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/" style={{ fontSize: '13px', color: 'var(--white-50)', textDecoration: 'none' }}>Home</a>
            <a href="/docs" style={{ fontSize: '13px', color: 'var(--white-50)', textDecoration: 'none' }}>Docs</a>
            <a href="/signup" style={{ fontSize: '13px', color: 'var(--white-50)', textDecoration: 'none' }}>Sign up</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BlogIndex({ posts, onOpen }) {
  return (
    <>
      <div style={{ marginBottom: '64px' }}>
        <div className="mono" style={{ fontSize: '11px', color: '#22c55e', letterSpacing: '0.1em', marginBottom: '16px' }}>BLOG</div>
        <h1 className="serif" style={{ fontSize: 'var(--type-h1)', color: 'white', lineHeight: 1.1 }}>
          Insights on AI economics,<br/>
          <span style={{ color: 'var(--white-35)' }}>agent profitability, and cost control.</span>
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {posts.map((post, i) => (
          <article key={post.slug} onClick={() => onOpen(post)} style={{
            padding: '32px 0',
            borderBottom: i < posts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            cursor: 'pointer', transition: 'all 200ms var(--ease-out)',
          }} onMouseEnter={e => e.currentTarget.style.paddingLeft = '12px'}
             onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)', letterSpacing: '0.06em' }}>{post.date}</span>
              <span className="mono" style={{
                fontSize: '9px', letterSpacing: '0.08em', fontWeight: 500,
                color: TAG_COLORS[post.tag] || 'var(--white-50)',
                background: `${TAG_COLORS[post.tag] || 'rgba(255,255,255,0.1)'}15`,
                padding: '2px 8px', borderRadius: '4px',
              }}>{post.tag}</span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)' }}>{post.readTime}</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'white', marginBottom: '8px', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{post.title}</h2>
            <p style={{ fontSize: '15px', color: 'var(--white-50)', lineHeight: 1.6 }}>{post.excerpt}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function BlogPost({ post, onBack }) {
  return (
    <article className="blog-content">
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: 'var(--white-50)',
        fontSize: '13px', cursor: 'pointer', marginBottom: '40px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>← Back to all posts</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span className="mono" style={{ fontSize: '12px', color: 'var(--white-35)', letterSpacing: '0.06em' }}>{post.date}</span>
        <span className="mono" style={{
          fontSize: '10px', letterSpacing: '0.08em', fontWeight: 500,
          color: TAG_COLORS[post.tag],
          background: `${TAG_COLORS[post.tag]}15`,
          padding: '3px 10px', borderRadius: '4px',
        }}>{post.tag}</span>
        <span className="mono" style={{ fontSize: '12px', color: 'var(--white-35)' }}>{post.readTime}</span>
      </div>

      <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: '40px', letterSpacing: '-0.02em' }}>
        {post.title}
      </h1>

      <div>
        {post.body()}
      </div>

      <div style={{ marginTop: '64px', padding: '32px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>Ready to see your agent P&L?</h3>
        <p style={{ fontSize: '14px', color: 'var(--white-50)', marginBottom: '20px' }}>Free for 2 agents. Live in 15 minutes.</p>
        <a href="/signup" className="btn-primary" style={{ padding: '12px 24px' }}>Start free →</a>
      </div>

      <style>{`
        .blog-content h3 { font-size: 22px; font-weight: 600; color: white; margin: 36px 0 14px; letter-spacing: -0.01em; }
        .blog-content p { font-size: 16px; color: var(--white-70); line-height: 1.75; margin-bottom: 18px; }
        .blog-content ul, .blog-content ol { padding-left: 20px; margin-bottom: 18px; }
        .blog-content li { font-size: 16px; color: var(--white-70); line-height: 1.75; margin-bottom: 8px; }
        .blog-content strong { color: var(--white-90); }
        .blog-content code { font-family: 'JetBrains Mono', monospace; font-size: 13px; background: var(--surface-2); padding: 2px 6px; border-radius: 4px; color: #4ade80; }
      `}</style>
    </article>
  );
}
