import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { logLead, checkLeadIntent } from './database.js';

const RESEND_KEY = process.env.RESEND_API_KEY;
const APOLLO_KEY = process.env.APOLLO_API_KEY;

// Initialize Resend and Supabase
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Email sequence templates
const emailSequence = {
  0: {
    subject: `Do you know which of your AI agents are profitable?`,
    body: (firstName, company) => `
      <p>Hi ${firstName},</p>
      <p>Quick question: do you know which of your AI agents have positive ROI and which are burning money silently?</p>
      <p>Most engineering leaders I talk to can answer their total LLM spend roughly. Almost none can tell me, with confidence, which specific agents are profitable.</p>
      <p>We built layeroi to solve this — 15-minute setup, then you have a live P&L for every agent your team is running. No infrastructure changes.</p>
      <p><a href="https://layeroi.com?ref=email">See it here</a>. Worth 20 minutes to show you the live version?</p>
      <p>Best,<br/>layeroi Team</p>
    `,
  },
  3: {
    subject: `Most teams can't answer which AI agents have positive ROI`,
    body: (firstName, company) => `
      <p>Hi ${firstName},</p>
      <p>I was thinking about your team at ${company} and realized this is probably your biggest blind spot:</p>
      <p>You can see total LLM spend. But which specific agents are profitable? Which ones are burning cash?</p>
      <p>Without this visibility, you're flying blind on your AI infrastructure. Engineering teams that know this metric:</p>
      <ul>
        <li>Cut AI spending by 30-40%</li>
        <li>Prioritize agent development based on ROI</li>
        <li>Get budget approval faster (CFO loves numbers)</li>
      </ul>
      <p>That's what layeroi does in 15 minutes. <a href="https://layeroi.com/demo?ref=email">Quick demo</a> if curious.</p>
      <p>Best,<br/>layeroi</p>
    `,
  },
  7: {
    subject: `How we helped ${'{company}'} cut AI spending by 40%`,
    body: (firstName, company) => `
      <p>Hi ${firstName},</p>
      <p>We just helped a company in ${company}'s space identify that 3 of their 8 AI agents had negative ROI.</p>
      <p>They were each burning $2-3K per month without any visibility. Once they saw the numbers on our dashboard, they optimized the models and prompts. Result: $40K in monthly savings.</p>
      <p>The kicker? They spent 15 minutes setting up layeroi. The analysis took maybe an hour total.</p>
      <p>That could be you. <a href="https://layeroi.com/demo?ref=email">See how it works</a> — no commitment, just a quick look.</p>
      <p>Best,<br/>layeroi Team</p>
    `,
  },
  14: {
    subject: `Your AI agent dashboard (live in 15 mins)`,
    body: (firstName, company) => `
      <p>Hi ${firstName},</p>
      <p>I wanted to follow up one more time because I think you'd find our dashboard useful.</p>
      <p>In 15 minutes, you'll have:</p>
      <ul>
        <li>Live P&L for every AI agent</li>
        <li>Cost breakdowns by model</li>
        <li>ROI per agent</li>
        <li>Profitability trends</li>
      </ul>
      <p>Then you can actually make smart decisions about which agents to keep, optimize, or sunset.</p>
      <p><a href="https://layeroi.com/demo?ref=email">Start your free trial</a> and see your numbers today. No credit card needed.</p>
      <p>Best,<br/>layeroi</p>
    `,
  },
  21: {
    subject: `Your last chance to try layeroi free`,
    body: (firstName, company) => `
      <p>Hi ${firstName},</p>
      <p>Last week we onboarded a CTO at a company like yours who said: "I can't believe we've been flying blind on this for so long."</p>
      <p>That's the common reaction once teams see their AI agent P&L.</p>
      <p>I'm reaching out one final time because I think you'd benefit from the same visibility.</p>
      <p><a href="https://layeroi.com/demo?ref=email">Try layeroi free for 14 days</a> — full feature access, no credit card. If it's not valuable, you'll know in the first 5 minutes.</p>
      <p>If it is, you'll have already saved money.</p>
      <p>Best,<br/>layeroi Team</p>
    `,
  },
};

export async function fetchLeadsFromApollo() {
  const { default: axios } = await import('axios');
  const response = await axios.post('https://api.apollo.io/v1/people/search', {
    api_key: APOLLO_KEY,
    q_person_titles: ['Head of AI', 'VP Engineering', 'CTO', 'Chief AI Officer'],
    company_size: ['200-500', '501-1000', '1001-5000'],
    company_industries: ['SaaS', 'Technology', 'Financial Services'],
    limit: 50,
  });

  return response.data.people || [];
}

export async function initiateColdEmailSequence() {
  const leads = await fetchLeadsFromApollo();

  for (const person of leads) {
    const email = person.email;

    if (!email) {
      console.log(`⚠️ No email found for ${person.first_name} ${person.last_name} at ${person.company?.name}`);
      continue;
    }

    // Check if lead already exists
    const { data: existing } = await supabase
      .from('cold_email_leads')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      console.log(`ℹ️ Lead ${email} already in sequence, skipping`);
      continue;
    }

    // Add to cold email sequence
    await supabase.from('cold_email_leads').insert({
      first_name: person.first_name,
      last_name: person.last_name,
      email,
      company_name: person.company?.name,
      title: person.title,
      sequence_day: 0,
      scheduled_for: new Date(),
      sent_emails: [0],
    });

    // Send Day 0 email immediately
    await sendSequenceEmail(person, 0);
  }
}

export async function processColdEmailSequence() {
  try {
    console.log('🔄 Processing cold email sequence...');

    // Fetch leads ready for next email
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: readyLeads, error } = await supabase
      .from('cold_email_leads')
      .select('*')
      .lte('scheduled_for', today.toISOString())
      .neq('sequence_day', 21);

    if (error) {
      console.error('❌ Error fetching leads:', error);
      return;
    }

    if (!readyLeads || readyLeads.length === 0) {
      console.log('✅ No leads ready for next email');
      return;
    }

    for (const lead of readyLeads) {
      try {
        const nextDay = getNextSequenceDay(lead.sequence_day);

        if (nextDay && emailSequence[nextDay]) {
          // Send next email
          const person = {
            first_name: lead.first_name,
            last_name: lead.last_name,
            company: { name: lead.company_name },
            email: lead.email,
          };

          await sendSequenceEmail(person, nextDay);

          // Update lead in database
          const sentEmails = [...(lead.sent_emails || []), nextDay];
          const nextScheduleDate = getNextScheduleDate(nextDay);

          await supabase
            .from('cold_email_leads')
            .update({
              sequence_day: nextDay,
              sent_emails: sentEmails,
              scheduled_for: nextScheduleDate,
              last_email_sent_at: new Date().toISOString(),
            })
            .eq('id', lead.id);

          console.log(`📧 Day ${nextDay} email sent to ${lead.email}`);
        }
      } catch (err) {
        console.error(`❌ Error processing lead ${lead.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Sequence processing failed:', err);
  }
}

export async function sendSequenceEmail(person, dayNumber) {
  const email = person.email;
  const template = emailSequence[dayNumber];

  if (!template) {
    console.error(`❌ No template for day ${dayNumber}`);
    return;
  }

  try {
    const subject = template.subject.replace('${company}', person.company?.name || 'your company');
    const body = template.body(person.first_name, person.company?.name || 'your company');

    await resend.emails.send({
      from: 'layeroi <hello@layeroi.com>',
      to: email,
      subject,
      html: `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              ${body}
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280;">
                <a href="https://layeroi.com" style="color: #C8F264; text-decoration: none;">layeroi</a> •
                <a href="https://layeroi.com/unsubscribe" style="color: #6b7280; text-decoration: none;">Unsubscribe</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });

    // Log to database
    await logLead({
      firstName: person.first_name,
      lastName: person.last_name,
      email,
      company: person.company?.name,
      title: person.title,
      sequence: dayNumber,
      sentAt: new Date(),
    });
  } catch (err) {
    console.error(`❌ Failed to send day ${dayNumber} email to ${email}:`, err);
    throw err;
  }
}

function getNextSequenceDay(currentDay) {
  const sequence = [0, 3, 7, 14, 21];
  const currentIndex = sequence.indexOf(currentDay);
  return currentIndex < sequence.length - 1 ? sequence[currentIndex + 1] : null;
}

function getNextScheduleDate(nextDay) {
  const date = new Date();
  date.setDate(date.getDate() + nextDay);
  return date.toISOString();
}

export async function sendColdEmailSequence() {
  // Kept for backwards compatibility - now calls new sequence
  await initiateColdEmailSequence();
}

export async function checkClicksAndAlert() {
  // This would integrate with Resend webhooks to track clicks
  // When a click is detected, log as hot lead
  const hotLeads = await checkLeadIntent();

  for (const lead of hotLeads) {
    console.log(`🔥 HOT LEAD: ${lead.firstName} ${lead.lastName} at ${lead.company} clicked the layeroi link`);
  }
}
