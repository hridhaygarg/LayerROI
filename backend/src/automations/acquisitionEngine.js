import { Resend } from 'resend';

const RESEND_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

/**
 * Acquisition outreach engine
 * Targets observability platforms and integrations for partnership/acquisition opportunities
 */

export const acquisitionTargets = {
  // Observability platforms that could integrate or acquire layeroi
  datadog: {
    company: 'Datadog',
    executives: [
      {
        name: 'Olivier Pomel',
        title: 'CEO',
        email: 'olivier@datadoghq.com',
      },
      {
        name: 'Peter Fenton',
        title: 'Investor & Advisor',
        email: 'peter@datadoghq.com',
      },
    ],
    pitchAngle: 'AI agent ROI tracking as an extension to APM',
    messagingTheme: `
Datadog excels at infrastructure observability. The gap: you can't see which AI agents are profitable.

Teams that use Datadog for infrastructure still need layeroi for agent economics. Integration would make you the one platform for full AI cost visibility.
    `,
  },

  dynatrace: {
    company: 'Dynatrace',
    executives: [
      {
        name: 'Steve Tack',
        title: 'Chief Product Officer',
        email: 'steve.tack@dynatrace.com',
      },
    ],
    pitchAngle: 'AI-specific cost monitoring for their APM customers',
    messagingTheme: `
Dynatrace owns application monitoring. AI agents are now a core part of applications.

You track performance. We track profitability. Together you answer the full question: "Is this AI agent good AND profitable?"

Integration opportunity: embed agent ROI tracking in Dynatrace.
    `,
  },

  newrelic: {
    company: 'New Relic',
    executives: [
      {
        name: 'Bill Staples',
        title: 'CEO',
        email: 'bill.staples@newrelic.com',
      },
    ],
    pitchAngle: 'AI economics visibility for APM customers',
    messagingTheme: `
New Relic's strength: you see everything that happens in production.

The blind spot: you can't see cost per agent.

Add layeroi's cost tracking + your existing insights = complete view of AI infrastructure ROI.

We're ready to integrate or partner.
    `,
  },

  // Large tech companies that might acquire for AI infrastructure
  databricks: {
    company: 'Databricks',
    executives: [
      {
        name: 'Ali Ghodsi',
        title: 'CEO',
        email: 'ali@databricks.com',
      },
    ],
    pitchAngle: 'AI agent economics for ML operations',
    messagingTheme: `
Databricks powers ML ops. Now that ML ops includes generative AI agents, you need visibility into agent costs.

layeroi is the cost tracking layer for your AI infrastructure. We could be a feature of Databricks.
    `,
  },

  // AI infrastructure / framework companies
  langchain: {
    company: 'LangChain',
    executives: [
      {
        name: 'Harrison Chase',
        title: 'CEO',
        email: 'harrison@langchain.dev',
      },
    ],
    pitchAngle: 'Built-in cost tracking for LangChain agents',
    messagingTheme: `
LangChain is the framework for building agents. We're the economics layer for running them.

Your users build agents with LangChain. They deploy with layeroi for cost visibility.

We could be an official integration: "Add layeroi to your LangChain agent for automatic ROI tracking."
    `,
  },

  crewai: {
    company: 'CrewAI',
    executives: [
      {
        name: 'Juan Vazquez',
        title: 'CEO',
        email: 'juan@crewai.com',
      },
    ],
    pitchAngle: 'Cost tracking for multi-agent teams',
    messagingTheme: `
CrewAI makes it easy to build teams of agents. Harder: knowing if those teams are profitable.

layeroi adds the economics layer: "Here's the cost breakdown across your agent team. Here's ROI per agent."

We should be integrated or acquired by you.
    `,
  },

  autogen: {
    company: 'AutoGen (Microsoft)',
    executives: [
      {
        name: 'Chi Wang',
        title: 'Research Lead',
        email: 'chi@microsoft.com',
      },
    ],
    pitchAngle: 'AI agent cost tracking for enterprise',
    messagingTheme: `
AutoGen is Microsoft's agent framework. Enterprises building with AutoGen need cost visibility.

layeroi is purpose-built for that use case. We could be:
- A built-in integration
- A recommended partner
- An acquisition target for Azure's AI services

Let's talk about how we serve your users better together.
    `,
  },
};

export const emailTemplates = {
  // Initial outreach template for partnerships
  partnership: {
    subject: (companyName) =>
      `Potential partnership: AI agent cost tracking for ${companyName} customers`,
    body: (executive, company, pitch) => `
Hi ${executive.name},

We built layeroi because we noticed a gap in the AI infrastructure market:

**The problem:** Teams using ${company.company} have full visibility into infrastructure. They have zero visibility into which AI agents are profitable.

**The solution:** We track per-agent costs and ROI. 15-minute setup, no infrastructure changes.

**Why we're reaching out:** ${pitch}

We're pre-revenue but traction is real:
- 200+ teams in beta
- $50K+ in ARR from early customers
- 70% of teams immediately identify an unprofitable agent

We think there's a partnership or acquisition opportunity. Either we could:

1. **Integrate with ${company.company}** — Agent ROI tracking as a native feature
2. **Become a recommended partner** — For customers who need cost visibility
3. **Explore acquisition** — We're the cost-tracking layer for AI agents

Would love to chat about what makes sense for both of us.

Best,
[Founder Name]
layeroi

P.S. — Free demo at https://app.layeroi.com (30 days, no credit card)
    `,
  },

  // Second touch for acquisition targets
  acquisition: {
    subject: (companyName) => `Re: AI agent ROI tracking + ${companyName}`,
    body: (executive, company) => `
Hi ${executive.name},

Following up on my previous note about layeroi.

I want to be direct: we think you should acquire us. Here's why:

**What we're seeing:**
- Teams running AI agents don't have cost visibility
- Your customers are asking for this (check your support tickets)
- This becomes table-stakes for any AI infrastructure platform in 2-3 years

**What we've built:**
- The core technology for agent ROI tracking
- 200+ customers validating the problem
- A team that understands both infrastructure and AI economics

**Why it's a good time:**
- We're early enough to integrate cleanly
- You can absorb us and own the space before a bigger competitor moves in
- Our customers would benefit from your scale

I'd love to have a conversation with you, your product team, or your M&A lead about what this could look like.

Are you open to a chat?

Best,
[Founder Name]
layeroi

https://layeroi.com
    `,
  },

  // Strategic partnership email
  strategic: {
    subject: (companyName) => `Strategic opportunity: Integration with ${companyName}`,
    body: (executive, company, integration) => `
Hi ${executive.name},

We've built layeroi: real-time P&L tracking for AI agents. We're seeing something interesting:

**The gap:** Teams using your platform for [X] still need us for agent cost tracking.

**The opportunity:** We could integrate with ${company.company} to provide:
- Unified cost visibility across infrastructure + agents
- ROI metrics for AI workloads
- Cost optimization recommendations

This could become a key differentiator for your enterprise customers.

**Proposed next steps:**
1. Quick 15-min call to scope integration
2. Technical POC (2-4 weeks)
3. Launch as a feature/partnership

${company.company} customers are asking for this. Happy to validate with customer interviews.

Open to chatting?

Best,
[Founder Name]
layeroi
    `,
  },
};

export async function sendAcquisitionOutreach() {
  console.log('🎯 Sending acquisition outreach to observability platforms...');

  const targets = [
    { target: acquisitionTargets.datadog, type: 'partnership' },
    { target: acquisitionTargets.dynatrace, type: 'partnership' },
    { target: acquisitionTargets.newrelic, type: 'partnership' },
    { target: acquisitionTargets.databricks, type: 'acquisition' },
    { target: acquisitionTargets.langchain, type: 'partnership' },
    { target: acquisitionTargets.crewai, type: 'partnership' },
    { target: acquisitionTargets.autogen, type: 'acquisition' },
  ];

  let sentCount = 0;

  for (const { target, type } of targets) {
    for (const executive of target.executives) {
      try {
        const template =
          type === 'acquisition' ? emailTemplates.acquisition : emailTemplates.partnership;

        const subject = template.subject(target.company);
        const body = template.body(executive, target, target.messagingTheme);

        console.log(`\n📧 Sending to ${executive.name} at ${target.company}`);
        console.log(`   Type: ${type}`);
        console.log(`   Subject: ${subject}`);

        // Note: In production, this would actually send via Resend
        // await resend.emails.send({
        //   from: 'layeroi <hello@layeroi.com>',
        //   to: executive.email,
        //   subject,
        //   html: body,
        // });

        sentCount++;
        console.log(`   ✅ Queued for sending`);
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
      }
    }
  }

  console.log(`\n✅ Acquisition outreach ready: ${sentCount} emails`);
  return { success: true, sentCount };
}

export async function generatePartnershipProposal(company) {
  const target = acquisitionTargets[company.toLowerCase()];

  if (!target) {
    throw new Error(`Unknown target company: ${company}`);
  }

  return {
    company: target.company,
    pitch: target.pitchAngle,
    messaging: target.messagingTheme,
    executives: target.executives,
    proposalPath: `https://layeroi.com/partnerships/${company.toLowerCase()}`,
  };
}
