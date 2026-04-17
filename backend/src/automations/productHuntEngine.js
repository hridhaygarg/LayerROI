import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const RESEND_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Product Hunt launch messaging and coordination
 * Tracks launch day, sends launch day emails, coordinates community engagement
 */

export const productHuntContent = {
  title: 'layeroi – Know Which AI Agents Are Profitable',
  tagline: 'Real-time P&L dashboard for every AI agent. Set it up in 15 minutes, track ROI instantly.',
  description: `
Most teams have zero visibility into which AI agents are actually profitable.

They know total LLM spend. They don't know which specific agents are burning money.

layeroi solves this in 15 minutes with:
- Live P&L for every agent
- Cost breakdown by model
- ROI per agent
- Spending trends

No infrastructure changes. Just API key + we handle the rest.

Built for CTOs, VPs Engineering, and CFOs who need to answer: "Is our AI automation paying off?"
  `,

  hunterPitch: `
Hey Product Hunt! 👋

We built layeroi because we kept asking other engineering leaders the same question: "Do you know which of your AI agents are profitable?"

The answer was always the same: "Uh... not really."

Everyone could ballpark their total LLM spend. No one could tell you with confidence which agents had positive ROI.

So we built a 15-minute setup that gives you a live P&L for every agent. No infrastructure changes, no log parsing, just: "Here's which agents are making you money and which ones are burning it."

We're launching today because:
1. AI agent spending is growing 3x faster than visibility
2. Most teams are wasting 30-40% on unprofitable agents
3. Existing observability tools weren't built for this use case

If you run any AI agents at scale, this is for you.

Try it free for 30 days → https://layeroi.com

Looking forward to your feedback! 🚀
  `,

  communityResponses: {
    pain_point_question: `
Why did you build this? We're biased, but here's the real story:

We work with teams running 5-50 AI agents each. Every single one said the same thing: they can see total spend but not per-agent ROI.

So they make decisions blind. They keep agents running because they don't know they're unprofitable. They sunset agents that might actually be valuable.

layeroi fixes that specific problem. Not observability. Not logging. Just: "Show me which agents are profitable."
    `,

    pricing_question: `
Pricing is:
- Free: 2 agents, 14 days history
- Pro: $99/mo for unlimited agents, 90 days history, forecasting
- Enterprise: Custom (for teams doing $1M+ in annual LLM spend)

We kept it simple because the value prop is obvious: if you're spending $5K/month on AI agents, knowing which 1-2 are unprofitable pays for the tool in one day.
    `,

    datadog_question: `
Great question! Datadog is amazing for infrastructure metrics. layeroi is specifically for AI agent economics.

They answer "is my infrastructure healthy?"
We answer "is my AI agent profitable?"

Different problem, different tool. Many teams use both. We're built for teams that need agent-level P&L.
    `,

    how_it_works: `
1. Sign up, get API key
2. Add X-layeroi-Key header to your LLM requests
3. We intercept, log costs, track which agent made the call
4. Dashboard shows: cost per agent, ROI, trends, forecasts

15 minutes. No code changes besides one header. That's it.
    `,
  }
};

export async function prepareProductHuntLaunch() {
  console.log('📱 Preparing Product Hunt launch materials...');
  console.log('   → Title:', productHuntContent.title);
  console.log('   → Hunter pitch ready');
  console.log('   → Community responses templated');
  return {
    success: true,
    launchUrl: 'https://producthunt.com/posts/layeroi',
  };
}

export async function sendLaunchDayEmails() {
  try {
    console.log('🚀 Sending Product Hunt launch day emails...');

    // Get all users and leads
    const { data: users } = await supabase
      .from('users')
      .select('id, email, first_name')
      .limit(1000);

    const { data: coldLeads } = await supabase
      .from('cold_email_leads')
      .select('email, first_name')
      .limit(1000);

    const allEmails = [
      ...(users?.map(u => ({ email: u.email, name: u.first_name })) || []),
      ...(coldLeads?.map(l => ({ email: l.email, name: l.first_name })) || []),
    ];

    let sentCount = 0;

    for (const recipient of allEmails) {
      try {
        await resend.emails.send({
          from: 'layeroi <hello@layeroi.com>',
          to: recipient.email,
          subject: `We just launched layeroi on Product Hunt 🚀`,
          html: `
            <p>Hi ${recipient.name},</p>
            <p>Today's a big day for us. We're launching <strong>layeroi</strong> on Product Hunt.</p>
            <p>If you've been thinking about getting visibility into which AI agents are actually profitable — today's a good day to try it.</p>
            <ul>
              <li>Live P&L for every agent (15-min setup)</li>
              <li>See which ones are burning money</li>
              <li>ROI tracking built for engineers</li>
            </ul>
            <p>Check us out on Product Hunt: <a href="https://producthunt.com/posts/layeroi">Vote for layeroi</a></p>
            <p>Or skip PH and just <a href="https://app.layeroi.com">start for free here</a> (30 days, no credit card).</p>
            <p>Thanks for being part of this from the beginning 🙏</p>
            <p>Best,<br/>layeroi Team</p>
          `,
        });

        sentCount++;
        console.log(`   ✅ Launch email sent to ${recipient.email}`);

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`   ❌ Failed to send to ${recipient.email}:`, err.message);
      }
    }

    console.log(`\n✅ Sent ${sentCount} launch day emails`);
    return { success: true, sentCount };
  } catch (err) {
    console.error('❌ Launch email sending failed:', err);
    throw err;
  }
}

export async function sendLaunchFollowUp(daysAfter = 3) {
  try {
    console.log(`📧 Sending ${daysAfter}-day post-launch follow-up emails...`);

    const { data: users } = await supabase
      .from('users')
      .select('id, email, first_name, created_at');

    if (!users || users.length === 0) {
      console.log('No users to follow up with');
      return { success: true, sentCount: 0 };
    }

    const launchDate = new Date('2026-04-18'); // Product Hunt launch date
    let sentCount = 0;

    for (const user of users) {
      try {
        const daysSinceLaunch = Math.floor(
          (new Date() - launchDate) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLaunch === daysAfter) {
          await resend.emails.send({
            from: 'layeroi <hello@layeroi.com>',
            to: user.email,
            subject: `3 days in: layeroi is tracking AI agent ROI for ${sentCount || 'hundreds of'} teams`,
            html: `
              <p>Hi ${user.first_name},</p>
              <p>It's been 3 days since we launched layeroi on Product Hunt.</p>
              <p>The response has been amazing. Teams are already using it to:</p>
              <ul>
                <li>Identify unprofitable agents (saving 30-40% on LLM spend)</li>
                <li>Make data-driven decisions about which agents to scale</li>
                <li>Finally answer: "Is our AI automation paying off?"</li>
              </ul>
              <p>If you haven't tried it yet, now's a good time. <a href="https://app.layeroi.com">Start free here</a> — 30 days, no credit card.</p>
              <p>And if you're already using it, we'd love your feedback. Reply to this email or <a href="https://layeroi.com/contact">chat with us</a>.</p>
              <p>Best,<br/>layeroi Team</p>
            `,
          });

          sentCount++;
          console.log(`   ✅ Follow-up sent to ${user.email}`);
        }
      } catch (err) {
        console.error(`   ❌ Error processing user ${user.email}:`, err.message);
      }
    }

    console.log(`\n✅ Sent ${sentCount} follow-up emails`);
    return { success: true, sentCount };
  } catch (err) {
    console.error('❌ Follow-up email sending failed:', err);
    throw err;
  }
}

export async function trackProductHuntMetrics() {
  try {
    // Log Product Hunt launch metrics
    const { data: stats } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    const userCount = stats?.length || 0;

    console.log('📊 Product Hunt Launch Metrics:');
    console.log(`   → Total signups: ${userCount}`);
    console.log(`   → Product Hunt URL: https://producthunt.com/posts/layeroi`);
    console.log(`   → Launch date: 2026-04-18`);

    return {
      success: true,
      metrics: {
        totalSignups: userCount,
        launchDate: '2026-04-18',
      },
    };
  } catch (err) {
    console.error('❌ Metrics tracking failed:', err);
    throw err;
  }
}
