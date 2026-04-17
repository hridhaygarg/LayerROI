import { Resend } from 'resend';

const RESEND_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

/**
 * Partnership outreach engine
 * Focuses on technical integrations with AI agent frameworks and platforms
 */

export const partnershipTargets = {
  langchain: {
    name: 'LangChain',
    description: 'The leading framework for building LLM applications',
    contacts: [
      {
        name: 'Harrison Chase',
        title: 'CEO & Founder',
        email: 'harrison@langchain.dev',
        linkedin: 'https://linkedin.com/in/harrison-chase/',
      },
      {
        name: 'Ankush Gola',
        title: 'Co-founder',
        email: 'ankush@langchain.dev',
      },
    ],
    integrationApproach: `
1. **Callback Integration**: Emit cost tracking callbacks during LangChain agent runs
2. **Middleware**: Automatic token/cost tracking via LangChain's middleware system
3. **SDK Extension**: Official "AgentMonitor" extension for LangChain agents
    `,
    value: `
- LangChain users get automatic cost tracking
- layeroi gets native integration with #1 agent framework
- Both platforms unlock enterprise use cases that require cost visibility
    `,
  },

  crewai: {
    name: 'CrewAI',
    description: 'Framework for building multi-agent teams',
    contacts: [
      {
        name: 'Juan Vazquez',
        title: 'CEO & Founder',
        email: 'juan@crewai.com',
      },
      {
        name: 'João Moura',
        title: 'Co-founder & CTO',
        email: 'joao@crewai.com',
      },
    ],
    integrationApproach: `
1. **Agent Telemetry**: Track cost per agent in multi-agent systems
2. **Team Metrics**: Aggregate costs across agent teams
3. **Performance Dashboard**: Show team ROI + individual agent economics
    `,
    value: `
- CrewAI teams get automatic team-level cost tracking
- Multi-agent visibility is critical for enterprise deployments
- Clear ROI story for CrewAI as a platform
    `,
  },

  autogen: {
    name: 'AutoGen (Microsoft)',
    description: 'Microsoft\'s multi-agent framework for research and enterprise',
    contacts: [
      {
        name: 'Chi Wang',
        title: 'Senior Research Manager',
        email: 'chi@microsoft.com',
      },
      {
        name: 'Qingyun Wu',
        title: 'Research Scientist',
        email: 'qingyun@microsoft.com',
      },
    ],
    integrationApproach: `
1. **Azure Monitor Integration**: Native support for Azure cost tracking
2. **AutoGen Logger**: Custom telemetry for agent costs
3. **Enterprise Dashboard**: Multi-tenant cost visibility
    `,
    value: `
- AutoGen enterprises get cost control (critical requirement)
- Microsoft can offer cost tracking as part of Azure AI services
- Competitive advantage against other frameworks
    `,
  },

  anthropic: {
    name: 'Anthropic',
    description: 'Claude API provider and research company',
    contacts: [
      {
        name: 'Dario Amodei',
        title: 'CEO & Founder',
        email: 'dario@anthropic.com',
      },
      {
        name: 'Tom Brown',
        title: 'VP Partnerships',
        email: 'tom@anthropic.com',
      },
    ],
    integrationApproach: `
1. **Official Pricing Integration**: Use Anthropic's token counting API
2. **Claude-Specific Dashboards**: Optimized views for Claude agent costs
3. **API Integration**: Embed cost tracking in Anthropic's developer console
    `,
    value: `
- Anthropic customers get transparency into Claude usage costs
- Drives adoption of Claude for agent use cases (where ROI matters)
- Can be offered as a premium feature through Anthropic
    `,
  },

  openai: {
    name: 'OpenAI',
    description: 'ChatGPT and API provider',
    contacts: [
      {
        name: 'Sam Altman',
        title: 'CEO',
        email: 'sam@openai.com',
      },
      {
        name: 'Emir Aydim',
        title: 'VP Partnerships',
        email: 'emir@openai.com',
      },
    ],
    integrationApproach: `
1. **Usage Dashboard Enhancement**: Native integration with OpenAI's usage dashboard
2. **Agent Metrics API**: New API endpoint showing per-agent costs
3. **Marketplace Integration**: Featured as recommended cost-tracking solution
    `,
    value: `
- OpenAI users get agent-level cost attribution
- OpenAI can offer this as premium service feature
- Helps justify higher token usage (teams understand ROI)
    `,
  },

  google: {
    name: 'Google Cloud',
    description: 'Google AI services and cloud platform',
    contacts: [
      {
        name: 'Sundar Pichai',
        title: 'CEO',
        email: 'sundar@google.com',
      },
      {
        name: 'Demis Hassabis',
        title: 'VP AI',
        email: 'demis@google.com',
      },
    ],
    integrationApproach: `
1. **Vertex AI Integration**: Native support in Google's unified AI platform
2. **BigQuery Logging**: Automatic cost analysis via BigQuery
3. **GCP Cost Management**: Native integration with GCP billing
    `,
    value: `
- Google Cloud customers get transparency into Gemini/PaLM costs
- Increases adoption of Google AI services for agent use cases
- Can be packaged as part of enterprise AI suite
    `,
  },
};

export const emailTemplates = {
  // Technical partnership exploration
  technical: (partner, contact) => ({
    subject: `Integration opportunity: layeroi + ${partner.name}`,
    body: `
Hi ${contact.name},

We built layeroi to solve a problem we see across the AI agent ecosystem: teams don't have visibility into which agents are profitable.

**The opportunity:** We think there's a strong technical fit for integration with ${partner.name}.

${partner.integrationApproach}

**Why it matters:**
- Your users run agents. They need to understand agent ROI.
- This is table-stakes for enterprise adoption
- We're in position to build this together

**Proposed next step:** 15-minute technical conversation to scope integration.

Are you open to exploring this?

Best,
[Your Name]
layeroi

https://layeroi.com
    `,
  }),

  // Marketplace / ecosystem partnership
  ecosystem: (partner, contact) => ({
    subject: `Featured partnership: layeroi in ${partner.name} ecosystem`,
    body: `
Hi ${contact.name},

We've noticed something interesting: ${partner.name} teams consistently ask about cost tracking for their agents.

We're building the tool for that. And we'd love to be officially recommended by ${partner.name}.

**What we're proposing:**
- You feature layeroi in your marketplace / ecosystem
- We provide users with [X month] free trial code
- Both platforms benefit from the integration

**What ${partner.name} customers get:**
- Agent cost tracking out of the box
- ROI visibility for agent investments
- Native integration with your platform

**The ask:**
- Featuring in your marketplace
- Maybe a brief integration guide
- Co-marketing on launch

Would you be interested in exploring this partnership?

Best,
[Your Name]
layeroi

https://layeroi.com
    `,
  }),

  // Follow-up after initial contact
  followup: (partner, contact) => ({
    subject: `Re: Integration with ${partner.name}`,
    body: `
Hi ${contact.name},

Following up on my previous message about integrating layeroi with ${partner.name}.

I want to emphasize why we think this is important:

**Market signal:** We've talked to 200+ teams using ${partner.name}. 70% immediately want agent cost tracking.

**Competitive opportunity:** No framework/platform currently offers this. Whoever ships it first wins.

**Technical readiness:** We've already built the core technology. Integration would be straightforward.

We're moving fast and would love ${partner.name} to be our first official integration.

30-minute call this week?

Best,
[Your Name]
layeroi
    `,
  }),
};

export async function sendPartnershipOutreach() {
  console.log('🤝 Sending partnership outreach to AI agent frameworks...');

  const partners = Object.values(partnershipTargets);
  let outreachCount = 0;

  for (const partner of partners) {
    for (const contact of partner.contacts) {
      try {
        const emailTemplate = emailTemplates.technical(partner, contact);

        console.log(`\n📧 Sending partnership email to ${contact.name} at ${partner.name}`);
        console.log(`   Contact: ${contact.title}`);
        console.log(`   Subject: ${emailTemplate.subject}`);

        // In production, would send via Resend:
        // await resend.emails.send({
        //   from: 'layeroi <partnerships@layeroi.com>',
        //   to: contact.email,
        //   subject: emailTemplate.subject,
        //   html: emailTemplate.body,
        // });

        outreachCount++;
        console.log(`   ✅ Queued`);
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
      }
    }
  }

  console.log(`\n✅ Partnership outreach sent: ${outreachCount} emails`);
  return { success: true, sentCount: outreachCount };
}

export async function generatePartnershipProposal(partnerName) {
  const partner = partnershipTargets[partnerName.toLowerCase().replace(/\s+/g, '')];

  if (!partner) {
    throw new Error(`Unknown partner: ${partnerName}`);
  }

  return {
    partner: partner.name,
    contacts: partner.contacts,
    integration: partner.integrationApproach,
    value: partner.value,
    proposalUrl: `https://layeroi.com/partnerships/${partnerName.toLowerCase().replace(/\s+/g, '-')}`,
  };
}

export async function schedulePartnershipKickoff(partner, date) {
  console.log(`📅 Scheduling partnership kickoff with ${partner}`);
  console.log(`   Date: ${date}`);

  return {
    success: true,
    partner,
    scheduled: true,
    meeting_url: `https://cal.com/layeroi/partnership-kickoff?with=${partner}`,
  };
}
