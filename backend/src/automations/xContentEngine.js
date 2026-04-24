import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

const PILLARS = ['agent_economics', 'cfo_translations', 'build_in_public', 'market_commentary'];

const PILLAR_PROMPTS = {
  agent_economics: `You write punchy X (Twitter) posts about the hidden economics of AI agents.
Focus: cost overruns, token waste, the gap between "AI saves money" and reality, per-agent P&L.
Tone: sharp, data-driven, slightly contrarian. Like a fintech founder who's seen the invoices.
Examples of angles: "Your AI agent burned $4,200 last month", "Most companies can't tell you which agent is profitable", "The average AI agent has negative ROI and nobody's measuring it"`,

  cfo_translations: `You translate AI/engineering jargon into language a CFO or VP Finance understands.
Focus: bridging the gap between engineering teams deploying agents and finance teams paying for them.
Tone: authoritative but accessible. Think "McKinsey partner who actually builds software."
Examples of angles: "Your CFO doesn't care about tokens. They care about cost per customer interaction.", "AI spend is the new cloud spend — and nobody learned from that mistake"`,

  build_in_public: `You write build-in-public updates for Layeroi, a platform that gives companies financial visibility into their AI agent fleet.
Focus: real metrics, product decisions, user feedback, lessons learned.
Tone: transparent, humble, specific. No vanity metrics.
Examples of angles: "We just shipped per-agent P&L reports", "3 things I learned building for CFOs who don't understand AI", "Our first paying customer found $2,400/month in wasted agent spend"`,

  market_commentary: `You comment on AI industry news through the lens of agent economics and ROI.
Focus: new model releases (cost implications), AI infrastructure trends, enterprise AI adoption.
Tone: informed, analytical, connecting dots others miss.
Examples of angles: "GPT-4o is 50% cheaper — but your agent costs won't drop 50%. Here's why.", "Every AI announcement focuses on capability. Nobody talks about the bill."`,
};

const BRAND_CONTEXT = `You are the voice of Layeroi — a platform that gives companies financial visibility into their AI agent fleet. Think: Datadog for AI costs, but built for the CFO.

Key messages:
- Most companies have no idea what their AI agents actually cost per task
- The ROI gap: agents that LOOK productive but lose money
- Layeroi tracks spend, value, and ROI per agent automatically
- We import from OpenAI, Anthropic, AWS Bedrock billing APIs — no code changes needed

Rules:
- Never use hashtags
- Never use emojis except sparingly (max 1 per post)
- Never say "game-changer", "revolutionary", "unleash", "skyrocket"
- Sound like a smart founder, not a marketing bot
- Be specific: use numbers, dollar amounts, percentages
- End with an insight, not a CTA (no "check out layeroi.com" — let curiosity do the work)`;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

function getTodayPillar() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return PILLARS[dayOfYear % PILLARS.length];
}

export async function generateDailyPosts() {
  const pillar = getTodayPillar();
  const client = getClient();

  const prompt = `${BRAND_CONTEXT}

${PILLAR_PROMPTS[pillar]}

Generate exactly 3 different X (Twitter) posts for today. Each must be under 280 characters.

Rules:
- Each post should take a DIFFERENT angle within the pillar
- No two posts should start the same way
- Include at least one that uses a specific number or dollar amount
- Make them standalone — no "1/3" numbering

Return ONLY a JSON array of 3 strings. No explanation, no markdown, just the JSON array.
Example format: ["Post one text here", "Post two text here", "Post three text here"]`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
  });

  const text = response.content[0].text.trim();
  let posts;
  try {
    posts = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) posts = JSON.parse(match[0]);
    else throw new Error('Failed to parse Claude response as JSON array');
  }

  const inserted = [];
  for (const content of posts) {
    const { data, error } = await supabase.from('pending_posts').insert({
      post_type: 'single',
      pillar,
      content: content.trim(),
      char_count: content.trim().length,
      status: 'pending_approval',
      generation_model: 'claude-sonnet-4-20250514',
      prompt_tokens: response.usage?.input_tokens || 0,
      output_tokens: response.usage?.output_tokens || 0,
    }).select().single();

    if (error) logger.error('Failed to insert post', error);
    else inserted.push(data);
  }

  logger.info('X-Ops: daily posts generated', { pillar, count: inserted.length });
  return inserted;
}

export async function generateWeeklyThread() {
  const { data: recent } = await supabase
    .from('pending_posts')
    .select('pillar')
    .eq('post_type', 'thread')
    .order('created_at', { ascending: false })
    .limit(2);

  const recentPillars = (recent || []).map(r => r.pillar);
  const pillar = PILLARS.find(p => !recentPillars.includes(p)) || PILLARS[0];
  const client = getClient();

  const prompt = `${BRAND_CONTEXT}

${PILLAR_PROMPTS[pillar]}

Write an X (Twitter) thread of exactly 5 tweets. The thread should tell a cohesive story or build an argument.

Rules:
- First tweet must hook — it should be compelling enough to make someone click "Show this thread"
- Each tweet must be under 280 characters
- Number them as 1/, 2/, 3/, 4/, 5/
- The last tweet should land a memorable insight (no CTA)
- Use a specific example, case study, or data point in tweets 2-4

Return ONLY a JSON array of 5 strings. No explanation, no markdown.
Example: ["1/ Hook tweet", "2/ Second point", "3/ Example", "4/ Deeper insight", "5/ Conclusion"]`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
  });

  const text = response.content[0].text.trim();
  let parts;
  try {
    parts = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) parts = JSON.parse(match[0]);
    else throw new Error('Failed to parse thread response');
  }

  const fullContent = parts.join('\n\n');
  const { data, error } = await supabase.from('pending_posts').insert({
    post_type: 'thread',
    pillar,
    content: fullContent,
    thread_parts: parts,
    char_count: fullContent.length,
    status: 'pending_approval',
    generation_model: 'claude-sonnet-4-20250514',
    prompt_tokens: response.usage?.input_tokens || 0,
    output_tokens: response.usage?.output_tokens || 0,
  }).select().single();

  if (error) throw error;
  logger.info('X-Ops: weekly thread generated', { pillar, parts: parts.length });
  return data;
}

export async function regeneratePost(postId) {
  const { data: existing } = await supabase
    .from('pending_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (!existing) throw new Error('Post not found');

  const client = getClient();
  const isThread = existing.post_type === 'thread';

  const prompt = `${BRAND_CONTEXT}

${PILLAR_PROMPTS[existing.pillar]}

${isThread
    ? `The previous thread was:\n${existing.content}\n\nWrite a COMPLETELY DIFFERENT 5-tweet thread on the same pillar. Different angle, different hook, different examples.\n\nReturn ONLY a JSON array of 5 strings.`
    : `The previous post was:\n"${existing.content}"\n\nWrite ONE new post that takes a COMPLETELY DIFFERENT angle on the same pillar. Under 280 characters.\n\nReturn ONLY the post text as a plain string (no quotes, no JSON).`
  }`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: isThread ? 2048 : 512,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.95,
  });

  const text = response.content[0].text.trim();
  let newContent, threadParts;

  if (isThread) {
    try { threadParts = JSON.parse(text); } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) threadParts = JSON.parse(match[0]);
      else throw new Error('Failed to parse regenerated thread');
    }
    newContent = threadParts.join('\n\n');
  } else {
    newContent = text.replace(/^["']|["']$/g, '');
    threadParts = null;
  }

  const { data, error } = await supabase
    .from('pending_posts')
    .update({
      content: newContent,
      thread_parts: threadParts,
      char_count: newContent.length,
      status: 'pending_approval',
      generated_at: new Date().toISOString(),
      prompt_tokens: response.usage?.input_tokens || 0,
      output_tokens: response.usage?.output_tokens || 0,
    })
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  logger.info('X-Ops: post regenerated', { postId });
  return data;
}
