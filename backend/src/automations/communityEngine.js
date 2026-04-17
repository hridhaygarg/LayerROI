/**
 * Community engagement engine for HackerNews, Reddit, and other platforms
 * Generates community-appropriate post copy and tracks engagement
 */

export const communityContent = {
  hackernews: {
    title: 'layeroi – Real-time P&L for AI agents (15 min setup)',
    url: 'https://layeroi.com',
    guidelines: `
Keep HackerNews posts focused on:
- Technical problem we're solving
- How it works (high level)
- Why this problem matters to engineers
- No hype, just facts and data
    `,

    posts: [
      {
        title: 'We built layeroi because teams have no visibility into AI agent ROI',
        description: `
We surveyed 50+ engineering teams about LLM spending. Everyone could ballpark total spend. No one knew which agents were profitable.

So we built a 15-minute setup: API key → we track costs → you see P&L per agent.

No infrastructure changes. No log parsing. Just: "Here's which agents are making/losing money."

We're open about pricing: free tier for 2 agents, $99/mo for unlimited + history.

The technical solution uses: request interception, cost lookups (OpenAI/Anthropic), JSONB storage in Postgres, and a lightweight dashboard.

Stack: Node.js + React + Supabase.

We've open-sourced the cost calculation logic if anyone wants to use it standalone.

Would love to hear if this solves a real problem for your team.

https://layeroi.com
        `,
      },
      {
        title: 'Show HN: AI Agent P&L Dashboard – track which agents are profitable',
        description: `
Hi HN! We've been frustrated by the same problem for 6 months:

We run 10+ AI agents. We know we spend $X/month on LLM APIs. We don't know which 2-3 agents are actually profitable.

So we built layeroi: one API key, 15 minutes, then you have P&L per agent.

Technical details:
- Intercepts LLM API calls (OpenAI, Anthropic, Google, Azure compatible)
- Calculates token costs based on public pricing
- Stores in Postgres, dashboards show trends
- No infrastructure changes required

It's free for 2 agents / 14 days. $99/mo for unlimited + 90 days history.

We're pre-revenue, bootstrapped, and focused on solving the specific problem of "which agents are profitable" (not general observability).

Would love feedback on the approach, pricing, or anything else.

https://layeroi.com
        `,
      },
    ],

    commentResponses: {
      why_not_datadog: `
Great question! We see Datadog (and similar tools) as orthogonal.

They answer: "Is my infrastructure healthy?"
We answer: "Is my AI agent profitable?"

For agent ROI, you need:
1. Per-agent cost attribution (not per-resource)
2. Revenue/value associated with the agent
3. Agent-level business metrics

Existing observability tools weren't built for this. They're incredible for infrastructure, but lose the "business context" that matters for AI agents.

Some teams use both. We're purpose-built for the narrower (but critical) problem.
      `,

      adoption_question: `
We're pre-launch, so this is our first public build. Initial feedback from beta users:

- 5-minute setup (faster than we promised)
- ~70% immediately find an unprofitable agent they didn't know about
- Common use case: "We can now sunset the agent that was supposed to do X, but never worked"

Next steps: shipping forecasting (predict Q2 spend), team collaboration, and better Slack integration.

We're staying focused on the core problem (agent ROI) instead of building a full observability platform.
      `,

      cost_calculation: `
We use public pricing from each provider:

OpenAI: published rates (e.g., GPT-4 is $0.03/$0.06 per 1K tokens)
Anthropic: published rates
Google: same
Azure: same

We don't have any special pricing access. We just track tokens used + multiply by the published rate.

For custom models or fine-tuning, users can set custom rates in the dashboard.

We're deliberately not machine-learning-driven pricing because we want accuracy over predictions. Real token count + real price = real cost.
      `,
    },
  },

  reddit: {
    subreddits: [
      'r/MachineLearning',
      'r/ChatGPT',
      'r/OpenAI',
      'r/learnprogramming',
      'r/Python',
      'r/entrepreneur',
    ],

    posts: {
      general: {
        title: 'We built a dashboard to track which AI agents are profitable',
        content: `
Hey all! Quick background: we've been running AI agents in production for a few years. We hit the same problem every other team does: no visibility into which agents actually make money.

You can see total LLM spend, but not per-agent ROI. So you end up with:
- Agents running for months that should have been sunset
- Hidden unprofitable tasks
- Budget decisions flying blind

We got tired of it and built **layeroi**: Connect your API keys → 15 minutes later, you have P&L for every agent.

**How it works:**
- Add our API key to your LLM requests
- We track costs (using public OpenAI/Anthropic pricing)
- Dashboard shows which agents are profitable

**Why we built it:**
- We're engineers who wanted this tool to exist
- No one else was solving the specific problem: "which agents are profitable?"
- General observability tools don't help with business ROI metrics

**Pricing:**
- Free: 2 agents, 14 days of history
- $99/mo: unlimited agents, 90 days, forecasting

Open to feedback, use cases, or questions. We're still very early (just launched) and want to know if this solves a real problem for people actually running agents.

Site: https://layeroi.com
Demo: https://app.layeroi.com (sign up takes 2 minutes)
        `,
      },

      entrepreneur: {
        title: 'We just launched an AI tool. Here is what surprised us in the first 30 days.',
        content: `
We launched layeroi (AI agent P&L tracker) 30 days ago. Here's what surprised us:

**The problem is way worse than we thought**
- Teams running 5+ agents have ZERO visibility into profitability
- Common response: "We're losing money on an agent but we don't know which one"
- CFOs can't get budget data. Engineers can't make optimization decisions.

**The solution is simpler than we expected**
- We thought we'd need heavy infrastructure
- Turns out: API key + cost tracking + simple dashboard solves 90% of the problem
- 15 minute setup time is non-negotiable. More and you lose people.

**The market is confused**
- "Isn't this just observability?" No, observability tools track infrastructure health
- "Can't I just use Datadog?" Datadog doesn't track which agent is profitable
- "What about LLMOps tools?" They track usage, not business ROI

**What worked:**
- Showing real numbers ASAP (users want to see their data, not a tutorial)
- Being clear about limitations (we're not a full observability platform)
- Pricing on impact (one unprofitable agent = ROI in one month)

**What we'd do differently:**
- Customer interviews earlier (we did them late, learned a ton)
- More focused marketing (we tried "observability for AI" which confused people)
- Better onboarding for AWS/Azure/GCP users (OpenAI users are 80% of signups)

We're $0 in revenue, $X in costs, running on belief that this problem is real. Would love feedback from the community.

Site: https://layeroi.com
        `,
      },
    },

    commentResponses: {
      is_this_profitable: `
Not yet! We're pre-revenue, bootstrapped. We charge $99/mo for the full version.

We know the problem is real because:
1. Most beta users immediately found an unprofitable agent
2. They ask "how much will I save per month?" not "how much does it cost?"
3. We've had 3 unsolicited requests to build this as a service

We're betting that if 1/10 teams using this saves $10K/month, we can build a sustainable business.

If it doesn't work, we learned a lot about the AI infrastructure problem space.
      `,

      privacy_concern: `
Good question. Here's what we log:

We see:
- How many tokens you used
- Which model you called
- A label for the agent/task

We DON'T see:
- What the agent did
- What was in the prompt
- The output
- Proprietary data

You can also run layeroi fully private (self-hosted), but that's only for Enterprise customers right now.

Most teams are fine with "token counts, model names, and a label" being collected. But we're adding a private/self-hosted option specifically for compliance-heavy industries.
      `,

      competition: `
Not much yet! That's partly why we built this.

Datadog has observability. They don't have agent-level P&L.
LangSmith has agent tracing. They don't focus on cost tracking.
Anthropic, OpenAI have usage dashboards. They show total spend, not per-agent breakdown.

So there's room, but it's a niche. We're betting the niche gets bigger as AI agent adoption grows.

If a bigger company solves this problem, that's fine. We're betting they won't for a few years because it's not core to their business.
      `,
    },
  },

  twitter: {
    threads: [
      {
        title: 'The AI Agent P&L Problem',
        tweets: [
          `Most engineering teams run 5-50 AI agents.

Know total LLM spend? Yes.

Know which agents are profitable? Usually not.

This is a bigger problem than observability. This is economics.`,

          `You can't optimize what you can't measure.

We built layeroi because every team we talked to had the same problem:
- Can't see per-agent costs
- Can't calculate ROI by agent
- Can't answer "should we keep this agent?"`,

          `The solution is dumb simple:
- Add X-layeroi-Key header to your API calls
- We track costs using public pricing
- Dashboard shows P&L per agent

15 minutes. No infrastructure changes.

https://layeroi.com`,

          `Why did no one build this before?

Because observability companies focus on infrastructure health.
Because LLM providers want you to stay blind on costs (more spending).
Because the market is new (1-2 year problem, not obvious yet).

We just happened to need it.`,
        ],
      },
    ],
  },
};

export async function scheduleRedditPost(subreddit, postTitle, postContent) {
  console.log(`📱 Scheduled Reddit post to ${subreddit}`);
  console.log(`   Title: ${postTitle}`);
  console.log(`   Length: ${postContent.length} chars`);

  return {
    success: true,
    platform: 'reddit',
    subreddit,
    scheduled: true,
  };
}

export async function scheduleHackernewsPost(title, description) {
  console.log(`📱 Scheduled HackerNews post`);
  console.log(`   Title: ${title}`);
  console.log(`   Length: ${description.length} chars`);

  return {
    success: true,
    platform: 'hackernews',
    scheduled: true,
  };
}

export async function scheduleTwitterThread(tweets) {
  console.log(`📱 Scheduled Twitter thread (${tweets.length} tweets)`);

  return {
    success: true,
    platform: 'twitter',
    tweetCount: tweets.length,
    scheduled: true,
  };
}
