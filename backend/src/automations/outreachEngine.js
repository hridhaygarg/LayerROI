import { generateText } from '../services/llmService.js';
import { Resend } from 'resend';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

const APOLLO_KEY = process.env.APOLLO_API_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || 'hello@layeroi.com';

const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

// ICP Definition for layeroi
const ICP = {
  titles: ['CTO', 'VP Engineering', 'Chief AI Officer', 'Head of AI', 'Engineering Director', 'VP Product'],
  industries: ['SaaS', 'Technology', 'Financial Services', 'Healthcare Tech', 'Enterprise Software'],
  companySizes: ['200-500', '501-1000', '1001-5000', '5001-10000'],
  signals: ['AI agent', 'LLM', 'machine learning', 'AI infrastructure', 'ML pipeline'],
};

export async function buildOutreachQueue() {
  try {
    logger.info('Starting outreach queue build...');
    const weekNumber = getWeekNumber();

    // Fetch prospects from Apollo API
    const prospects = await fetchProspectsFromApollo();

    if (!prospects || prospects.length === 0) {
      logger.warn('No prospects found from Apollo');
      return { success: false, message: 'No prospects found' };
    }

    let addedCount = 0;

    for (const prospect of prospects) {
      try {
        // Skip if already in queue (deduplication)
        const existing = await supabase
          .from('outreach_queue')
          .select('id')
          .eq('prospect_email', prospect.email)
          .single();

        if (existing.data) {
          logger.info(`Prospect ${prospect.email} already in queue, skipping`);
          continue;
        }

        // Research company data
        const researchData = await researchCompany(prospect.company?.name || '');

        // Calculate ICP score
        const icpScore = calculateICPScore(prospect, researchData);

        // Insert into queue as 'pending'
        const { error } = await supabase.from('outreach_queue').insert({
          prospect_name: `${prospect.first_name} ${prospect.last_name}`,
          prospect_title: prospect.title || 'Engineering Lead',
          prospect_email: prospect.email,
          company_name: prospect.company?.name || 'Unknown',
          company_size: prospect.company?.size || 'Unknown',
          company_industry: prospect.company?.industry || 'Technology',
          company_website: prospect.company?.website || '',
          research_data: researchData,
          icp_score: icpScore,
          fit_reason: generateFitReason(prospect, researchData),
          status: 'pending',
          source: 'apollo',
          queue_week: weekNumber,
        });

        if (error) {
          logger.error('Failed to insert prospect into queue', {
            email: prospect.email,
            error: error.message,
          });
          continue;
        }

        addedCount++;
        logger.info(`Added prospect to queue: ${prospect.email}`);
      } catch (err) {
        logger.error('Error processing prospect', {
          prospect: prospect.email,
          error: err.message,
        });
      }
    }

    logger.info(`Outreach queue built with ${addedCount} prospects`);
    return {
      success: true,
      prospectCount: addedCount,
      weekNumber,
    };
  } catch (err) {
    logger.error('Outreach queue build failed', err);
    throw err;
  }
}

export async function generateMessagesForQueue() {
  try {
    logger.info('Starting message generation for pending prospects...');

    // Fetch all prospects with status 'pending' (not yet had messages generated)
    const { data: prospects, error } = await supabase
      .from('outreach_queue')
      .select('*')
      .eq('status', 'pending')
      .order('icp_score', { ascending: false })
      .limit(20); // Process up to 20 per run to avoid API rate limits

    if (error) {
      logger.error('Failed to fetch pending prospects', error);
      throw error;
    }

    if (!prospects || prospects.length === 0) {
      logger.info('No pending prospects to generate messages for');
      return { success: true, messageCount: 0 };
    }

    let generatedCount = 0;

    for (const prospect of prospects) {
      try {
        // Generate personalized message
        const message = await generatePersonalizedMessage(prospect);

        // Update status to 'queued' and store message
        const { error: updateError } = await supabase
          .from('outreach_queue')
          .update({
            personalized_message: message,
            message_generated_at: new Date().toISOString(),
            status: 'queued',
            status_updated_at: new Date().toISOString(),
          })
          .eq('id', prospect.id);

        if (updateError) {
          logger.error('Failed to update prospect with message', {
            prospectId: prospect.id,
            error: updateError.message,
          });
          continue;
        }

        generatedCount++;
        logger.info(`Generated message for ${prospect.prospect_email}`);
      } catch (err) {
        logger.error('Error generating message for prospect', {
          prospectId: prospect.id,
          email: prospect.prospect_email,
          error: err.message,
        });
      }
    }

    logger.info(`Messages generated: ${generatedCount}/${prospects.length}`);
    return { success: true, messageCount: generatedCount };
  } catch (err) {
    logger.error('Message generation failed', err);
    throw err;
  }
}

export async function sendOutreachEmails() {
  try {
    logger.info('Starting outreach email sending...');

    if (!resend) {
      logger.error('Resend not initialized - missing RESEND_API_KEY');
      return { success: false, message: 'Resend not configured' };
    }

    // Fetch all queued prospects
    const { data: prospects, error } = await supabase
      .from('outreach_queue')
      .select('*')
      .eq('status', 'queued')
      .order('icp_score', { ascending: false })
      .limit(50); // Send up to 50 per run

    if (error) {
      logger.error('Failed to fetch queued prospects', error);
      throw error;
    }

    if (!prospects || prospects.length === 0) {
      logger.info('No queued prospects to send');
      return { success: true, sentCount: 0 };
    }

    let sentCount = 0;

    for (const prospect of prospects) {
      try {
        const htmlEmail = generateEmailHTML(prospect);

        // Send via Resend
        await resend.emails.send({
          from: `layeroi <${COMPANY_EMAIL}>`,
          to: prospect.prospect_email,
          subject: `AI Agent ROI for ${prospect.company_name}`,
          html: htmlEmail,
          reply_to: COMPANY_EMAIL,
        });

        // Update status to 'sent'
        await supabase
          .from('outreach_queue')
          .update({
            status: 'sent',
            email_sent_at: new Date().toISOString(),
            status_updated_at: new Date().toISOString(),
            attempt_count: (prospect.attempt_count || 0) + 1,
          })
          .eq('id', prospect.id);

        sentCount++;
        logger.info(`Email sent to ${prospect.prospect_email}`);

        // Rate limiting - add small delay between sends
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        logger.error('Error sending email to prospect', {
          prospectId: prospect.id,
          email: prospect.prospect_email,
          error: err.message,
        });

        // Update with error
        await supabase
          .from('outreach_queue')
          .update({
            last_error: err.message,
            attempt_count: (prospect.attempt_count || 0) + 1,
          })
          .eq('id', prospect.id);
      }
    }

    logger.info(`Emails sent: ${sentCount}/${prospects.length}`);
    return { success: true, sentCount };
  } catch (err) {
    logger.error('Email sending failed', err);
    throw err;
  }
}

export async function sendFollowUpReminders() {
  try {
    logger.info('Checking for follow-up candidates...');

    // Fetch emails sent 3 days ago with no reply
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: followUpCandidates, error } = await supabase
      .from('outreach_queue')
      .select('*')
      .eq('status', 'sent')
      .lt('email_sent_at', threeDaysAgo)
      .is('response_received_at', null)
      .is('follow_up_queued_at', null)
      .limit(30);

    if (error) {
      logger.error('Failed to fetch follow-up candidates', error);
      throw error;
    }

    if (!followUpCandidates || followUpCandidates.length === 0) {
      logger.info('No follow-up candidates found');
      return { success: true, followUpCount: 0 };
    }

    let followUpCount = 0;

    for (const prospect of followUpCandidates) {
      try {
        // Generate follow-up message
        const followUpMessage = await generateFollowUpMessage(prospect);

        // Update with follow-up queued status
        await supabase
          .from('outreach_queue')
          .update({
            follow_up_message: followUpMessage,
            follow_up_queued_at: new Date().toISOString(),
          })
          .eq('id', prospect.id);

        followUpCount++;
        logger.info(`Follow-up queued for ${prospect.prospect_email}`);
      } catch (err) {
        logger.error('Error generating follow-up for prospect', {
          prospectId: prospect.id,
          error: err.message,
        });
      }
    }

    logger.info(`Follow-ups queued: ${followUpCount}/${followUpCandidates.length}`);
    return { success: true, followUpCount };
  } catch (err) {
    logger.error('Follow-up reminder generation failed', err);
    throw err;
  }
}

// Helper functions

async function fetchProspectsFromApollo() {
  try {
    const { data } = await axios.post(
      'https://api.apollo.io/v1/people/search',
      {
        api_key: APOLLO_KEY,
        q_person_titles: ICP.titles.join('|'),
        company_industries: ICP.industries,
        company_size: ICP.companySizes,
        limit: 20,
      },
      { timeout: 10000 }
    );

    return data.people || [];
  } catch (err) {
    logger.error('Apollo API fetch failed', err);
    // Return fallback prospects if API fails
    return getFallbackProspects();
  }
}

async function researchCompany(companyName) {
  try {
    // In production, integrate with SerpAPI or similar
    // For now, return mock data structure
    return {
      companyName,
      foundedYear: 2015,
      employees: 500,
      funding: '100M+',
      technologies: ['AI', 'ML', 'Cloud'],
      recentNews: 'Hypothetical company news',
      website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    };
  } catch (err) {
    logger.warn('Company research failed', { companyName });
    return {};
  }
}

function calculateICPScore(prospect, researchData) {
  let score = 0.5; // Base score

  // Title match
  if (ICP.titles.some((t) => prospect.title?.toLowerCase().includes(t.toLowerCase()))) {
    score += 0.2;
  }

  // Industry match
  if (ICP.industries.some((i) => prospect.company?.industry?.toLowerCase().includes(i.toLowerCase()))) {
    score += 0.15;
  }

  // Company size match
  if (ICP.companySizes.includes(prospect.company?.size)) {
    score += 0.15;
  }

  return Math.min(1.0, score);
}

function generateFitReason(prospect, researchData) {
  const reasons = [];

  if (ICP.titles.some((t) => prospect.title?.toLowerCase().includes(t.toLowerCase()))) {
    reasons.push(`${prospect.title} is a perfect fit for layeroi`);
  }

  if (researchData.technologies?.some((t) => ICP.signals.some((s) => t.toLowerCase().includes(s.toLowerCase())))) {
    reasons.push('Company actively uses AI/ML technology');
  }

  return reasons.length > 0 ? reasons.join('. ') : 'Strong engineering leadership at target company';
}

async function generatePersonalizedMessage(prospect) {
  try {
    const prompt = `You are a B2B sales representative for layeroi, a platform that tracks AI agent ROI and profitability.

Prospect:
- Name: ${prospect.prospect_name}
- Title: ${prospect.prospect_title}
- Company: ${prospect.company_name}
- Industry: ${prospect.company_industry}
- Company Size: ${prospect.company_size}

Company Research:
${prospect.fit_reason}

Generate a short, personalized LinkedIn outreach message (3-4 sentences max) that:
1. References their specific role and company
2. Mentions a specific pain point (AI agents burning money without visibility)
3. Offers a quick value prop (15-min setup, live P&L for every agent)
4. Ends with a clear CTA (would 20 minutes work for a quick show?)

Keep it conversational, not salesy. Include NO HTML or formatting.`;

    const result = await generateText({
      prompt,
      systemPrompt: 'You are a B2B sales rep. Write concise, personalized outreach. No preamble. Just the message.',
      maxTokens: 200,
      temperature: 0.7,
    });

    return result.text;
  } catch (err) {
    logger.error('Message generation failed', err);
    // Return fallback message
    return `Hi ${prospect.prospect_name}, Most engineering teams run AI agents but lack visibility into which ones are profitable. We built layeroi to solve this — 15-min setup, then live P&L for every agent. Would 20 minutes work for a quick walkthrough?`;
  }
}

async function generateFollowUpMessage(prospect) {
  try {
    const prompt = `Generate a brief follow-up message for ${prospect.prospect_name} at ${prospect.company_name}.

Original context: They received an initial outreach about layeroi, an AI agent ROI tracking platform.

Create a 2-3 sentence follow-up that:
1. References the previous message subtly
2. Adds a new angle or insight about AI ROI
3. Keeps the CTA simple (just ask if worth scheduling a call)

Keep it casual and non-pushy.`;

    const result = await generateText({
      prompt,
      systemPrompt: 'Write a brief, casual follow-up email. No preamble. Just the message text.',
      maxTokens: 150,
      temperature: 0.7,
    });

    return result.text;
  } catch (err) {
    logger.error('Follow-up generation failed', err);
    return `Hey ${prospect.prospect_name}, wanted to circle back on layeroi. Most teams we talk to are surprised by how much they're spending on unprofitable agents. Worth a quick 15-min call to see if it applies to you?`;
  }
}

function generateEmailHTML(prospect) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: 700; color: #111827; }
    .content { margin-bottom: 30px; }
    .message { white-space: pre-wrap; font-size: 15px; line-height: 1.7; margin-bottom: 20px; }
    .cta { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; }
    .footer { color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">layeroi</div>
    </div>

    <div class="content">
      <p>Hi ${prospect.prospect_name},</p>

      <div class="message">${prospect.personalized_message}</div>

      <p><a href="https://layeroi.com/demo" class="cta">See It Live</a></p>

      <p>Best,<br/>
      The layeroi Team</p>
    </div>

    <div class="footer">
      <p>layeroi helps engineering teams track AI agent profitability. No infrastructure changes needed.</p>
      <p>&copy; 2026 layeroi. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const week = Math.ceil(day / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getFallbackProspects() {
  // Return sample prospects if API fails
  return [
    {
      first_name: 'Jane',
      last_name: 'Chen',
      email: 'jane.chen@techcorp.com',
      title: 'CTO',
      company: { name: 'TechCorp Inc', size: '500-1000', industry: 'SaaS' },
    },
    {
      first_name: 'Mike',
      last_name: 'Johnson',
      email: 'mike.j@innovate.io',
      title: 'VP Engineering',
      company: { name: 'Innovate AI', size: '200-500', industry: 'Technology' },
    },
  ];
}
