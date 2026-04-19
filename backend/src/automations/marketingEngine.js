import { generateText, generateShortContent } from '../services/llmService.js';
import { logger } from '../utils/logger.js';

// Twitter API (add keys when ready)
const TWITTER_BEARER = process.env.TWITTER_BEARER_TOKEN;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;

// Content themes and data points for AI to use
const BRAND_CONTEXT = `
You are the marketing AI for layeroi — enterprise financial infrastructure for AI agents.

BRAND VOICE:
- Authoritative but not arrogant
- Data-driven, specific numbers always
- Speaks to CFOs and VP Finance, not engineers
- Direct, no fluff, no buzzwords
- Confident — we are the only tool that does this

KEY DATA POINTS (use these in content):
- 23% average AI spend wasted across 200+ teams
- $4,000 burned in 90 minutes by a single runaway loop
- Kill switch detects and stops loops in under 60 seconds
- <5ms proxy overhead (p99: 4.7ms across 47M calls)
- 15 minutes from install to first P&L data
- Average payback period: 11 days
- 70% of teams find unprofitable agents in week 1
- 99.97% uptime SLA
- Supports OpenAI, Anthropic, Google Gemini, Azure, LangChain, CrewAI

PRODUCT:
- Real-time P&L per AI agent (cost, revenue, ROI multiple)
- Budget envelopes with automatic throttling (80% warn, 95% throttle, 100% block)
- Kill switch for runaway agent loops
- Weekly board-ready CFO reports (PDF, auto-delivered Monday AM)
- All plans self-serve, no sales calls needed

PRICING:
- Free: 2 agents, no credit card
- Starter: $499/mo, 5 agents
- Business: $2,500/mo, 30 agents
- Enterprise: $8,500/mo, unlimited, SSO, SLA, data residency

COMPETITORS (differentiation):
- Datadog: monitors infrastructure, not profitability
- Helicone: logs API calls, no P&L or ROI
- LiteLLM: cost by API key, no agent-level attribution
- We are the ONLY tool built for financial visibility, not engineering observability

WEBSITE: layeroi.com
`;

const CONTENT_TYPES = {
  tweet: {
    prompt: (theme) => `${BRAND_CONTEXT}

Generate a single high-engagement tweet for Twitter/X about: ${theme}

Rules:
- Max 280 characters
- No hashtags (we add those separately)
- No emojis unless they add real value
- Include a specific number or data point
- End with a hook, question, or CTA
- Do NOT start with "We" — vary sentence openers
- Sound like a founder, not a brand account

Examples of good tweets in our voice:

"One of our early users found an AI agent burning $4,200/hour in a recursive loop. Our kill switch stops this in 60 seconds. layeroi.com"

"Datadog shows tokens. LangSmith shows traces. Helicone shows latency. None of them answer: which agents are worth what they cost? layeroi.com"

"40% of agentic AI projects cancelled due to unclear ROI (Gartner). Not because the tech failed. Because nobody could prove the ROI. layeroi.com"

Write ONE tweet. Just the tweet text. No quotes. No explanation before or after.`,
  },

  tweet_thread: {
    prompt: (theme) => `${BRAND_CONTEXT}

Generate a 4-tweet thread for Twitter/X about: ${theme}

Rules:
- Tweet 1: Hook that stops the scroll (provocative claim or surprising data)
- Tweet 2-3: Supporting evidence with specific numbers
- Tweet 4: CTA to layeroi.com
- Each tweet max 280 characters
- Number them 1/ 2/ 3/ 4/
- No hashtags
- Sound like a founder sharing insights, not marketing

Return ONLY the thread text with each tweet on a new line.`,
  },

  instagram_caption: {
    prompt: (theme) => `${BRAND_CONTEXT}

Generate an Instagram post caption about: ${theme}

Rules:
- Opening line must hook (this is what shows before "...more")
- 3-5 short paragraphs
- Include 2-3 specific data points
- End with a CTA: "Link in bio" or "layeroi.com"
- Add 8-12 relevant hashtags at the end
- Mix of broad (#AI #startups) and niche (#AIcosts #LLMmonitoring)
- Conversational but authoritative tone

Return ONLY the caption text.`,
  },

  instagram_carousel: {
    prompt: (theme) => `${BRAND_CONTEXT}

Generate Instagram carousel slide content about: ${theme}

Rules:
- 6-7 slides
- Slide 1: Bold headline that hooks (5-8 words max)
- Slides 2-5: One key point per slide with a supporting stat
- Slide 6: Summary or takeaway
- Slide 7: CTA — "layeroi.com | Free for 2 agents"
- Each slide should be 2-3 lines max (it's visual content)
- Format: "SLIDE 1: [text]" on each line

Also provide a caption (3-4 lines + hashtags).

Return slides first, then "---CAPTION---" then the caption.`,
  },

  blog_outline: {
    prompt: (theme) => `${BRAND_CONTEXT}

Generate a blog post outline for layeroi.com/blog about: ${theme}

Rules:
- SEO-optimized title (include target keyword naturally)
- 5-7 section headers (H2/H3)
- 2-3 bullet points per section describing what to cover
- Include specific data points to reference
- Suggest a meta description (155 chars max)
- Target word count: 1,200-1,800 words
- Tone: authoritative, data-backed, useful

Format:
TITLE: ...
META: ...
SECTIONS:
## Section Name
- Point 1
- Point 2
...`,
  },

  email_subject: {
    prompt: (theme) => `${BRAND_CONTEXT}

Generate 5 email subject lines for a cold outreach email about: ${theme}

Rules:
- Each under 50 characters
- No spam trigger words (free, guarantee, act now)
- Personalization-ready (can add {{company}} or {{name}})
- Focus on the pain point, not the product
- At least one question format
- At least one number format

Return 5 subject lines, one per line, numbered 1-5.`,
  },

  linkedin_post: {
    prompt: (theme) => `${BRAND_CONTEXT}

Generate a LinkedIn post about: ${theme}

Rules:
- Opening hook line (shows in preview — must grab attention)
- 4-6 short paragraphs (LinkedIn rewards line breaks)
- Include 2-3 specific data points
- Sound like a thoughtful founder, not a company page
- End with a question to drive comments
- No hashtags inline, add 3-5 at the very end
- 800-1200 characters total

Return ONLY the post text.`,
  },
};

// Content themes to rotate through
const WEEKLY_THEMES = [
  // Week 1
  [
    { type: 'tweet', theme: 'the hidden cost of running AI agents without visibility — use a specific $ figure' },
    { type: 'tweet', theme: 'why CFOs need their own AI dashboard separate from engineering tools' },
    { type: 'tweet', theme: 'the kill switch feature and how it prevents runaway loops' },
    { type: 'tweet', theme: 'quick comparison: what engineers see vs what CFOs need to see' },
    { type: 'tweet', theme: 'the 15-minute setup process and why no infrastructure changes needed' },
    { type: 'instagram_caption', theme: 'the 23% waste problem in AI agent spending' },
    { type: 'instagram_carousel', theme: '5 numbers every CFO running AI agents needs to know' },
    { type: 'linkedin_post', theme: 'why the AI observability market has a blind spot for finance teams' },
    { type: 'blog_outline', theme: 'how to calculate ROI for AI agents in production' },
  ],
  // Week 2
  [
    { type: 'tweet', theme: 'budget envelopes feature and automatic spend caps' },
    { type: 'tweet', theme: 'a real customer story about finding waste (use Sarah Chen example)' },
    { type: 'tweet', theme: 'the difference between token tracking and profit tracking' },
    { type: 'tweet', theme: 'model over-provisioning waste — using GPT-4 when GPT-4o-mini works' },
    { type: 'tweet_thread', theme: 'breaking down where the 23% waste comes from in enterprise AI spend' },
    { type: 'instagram_caption', theme: 'before and after connecting layeroi — the visibility transformation' },
    { type: 'instagram_carousel', theme: 'how layeroi works in 3 steps — technical but visual' },
    { type: 'linkedin_post', theme: 'the board meeting question nobody can answer about AI agent ROI' },
    { type: 'blog_outline', theme: 'AI agent cost optimization: 5 strategies that save enterprises $100K+/year' },
  ],
  // Week 3
  [
    { type: 'tweet', theme: 'the payback period for layeroi (11 days average)' },
    { type: 'tweet', theme: 'provocative take: most AI agent teams are running at a loss' },
    { type: 'tweet', theme: 'the proxy architecture and why <5ms overhead matters' },
    { type: 'tweet', theme: 'weekly CFO reports that get delivered automatically' },
    { type: 'tweet_thread', theme: 'the $4,000 bug — how a single retry loop burned thousands overnight' },
    { type: 'instagram_caption', theme: 'the kill switch feature — protecting against runaway agent loops' },
    { type: 'instagram_carousel', theme: 'layeroi vs Datadog vs Helicone — feature comparison' },
    { type: 'linkedin_post', theme: 'lessons from tracking 47 million AI API calls — what the data shows' },
    { type: 'blog_outline', theme: 'the CFO guide to AI agent financial management' },
  ],
  // Week 4
  [
    { type: 'tweet', theme: 'self-serve enterprise pricing and why no sales calls needed' },
    { type: 'tweet', theme: 'the concept of AI agents as employees who need performance reviews' },
    { type: 'tweet', theme: 'data residency and compliance for enterprise AI cost tracking' },
    { type: 'tweet', theme: 'the free tier and how 2 agents is enough to prove value' },
    { type: 'tweet_thread', theme: 'how a Series B fintech saved $218K/year with per-agent cost tracking' },
    { type: 'instagram_caption', theme: 'pricing transparency — all plans self-serve, no sales calls' },
    { type: 'instagram_carousel', theme: 'real ROI numbers from layeroi customers' },
    { type: 'linkedin_post', theme: 'the gap between AI spending and AI accountability in enterprises' },
    { type: 'blog_outline', theme: 'runaway AI agent loops: detection, prevention, and the real cost' },
  ],
];

/**
 * Generate a single piece of content using Claude
 */
export async function generateContent(type, theme) {
  const contentType = CONTENT_TYPES[type];
  if (!contentType) {
    return { success: false, error: `Unknown content type: ${type}` };
  }

  try {
    const isTweet = type === 'tweet';
    const fullPrompt = contentType.prompt(theme);

    let result;
    if (isTweet) {
      result = await generateShortContent({
        prompt: fullPrompt,
        systemPrompt: 'Be concise. No preamble. No meta-commentary. Just the output.',
        maxLength: 280,
      });
    } else {
      result = await generateText({
        prompt: fullPrompt,
        systemPrompt: 'Be concise. No preamble. No meta-commentary. Just the output.',
        maxTokens: type === 'blog_outline' ? 2000 : 1024,
        temperature: type === 'tweet_thread' ? 0.85 : 0.7,
      });
    }

    logger.info('Content generated', { type, theme, provider: result.provider, length: result.text.length });

    return {
      success: true,
      type,
      theme,
      content: result.text,
      provider: result.provider,
      model: result.model,
      generatedAt: new Date().toISOString(),
      tokens: result.tokens,
    };
  } catch (err) {
    logger.error('Content generation failed', err, { type, theme });
    return { success: false, error: err.message };
  }
}

/**
 * Generate a full week of content
 */
export async function generateWeeklyContent() {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % WEEKLY_THEMES.length;
  const themes = WEEKLY_THEMES[weekNumber];

  logger.info('Generating weekly content', { weekNumber, themeCount: themes.length });

  const results = [];
  for (const item of themes) {
    const result = await generateContent(item.type, item.theme);
    results.push(result);
    // Rate limit: wait 2s between generations
    await new Promise(r => setTimeout(r, 2000));
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  logger.info('Weekly content generation complete', { successful, failed });

  return {
    success: true,
    weekNumber,
    generated: successful,
    failed,
    content: results,
  };
}

/**
 * Generate daily tweet
 */
export async function generateDailyTweet() {
  const dayThemes = [
    'a surprising data point about AI agent costs that most teams don\'t know',
    'why the CFO should care about AI agent ROI more than the CTO',
    'a specific layeroi feature that saves money immediately',
    'the gap between what engineers track and what finance needs',
    'a quick win that any team with AI agents can implement today',
    'a provocative take on the state of AI cost management',
    'social proof — what teams discover in their first 48 hours with layeroi',
  ];

  const dayOfWeek = new Date().getDay();
  const theme = dayThemes[dayOfWeek];

  const result = await generateContent('tweet', theme);

  if (result.success && TWITTER_BEARER && TWITTER_ACCESS_TOKEN) {
    // Auto-post to Twitter if API keys are configured
    try {
      const posted = await postTweet(result.content);
      result.posted = posted;
      logger.info('Tweet auto-posted', { tweetId: posted.id });
    } catch (err) {
      logger.error('Tweet auto-post failed', err);
      result.posted = false;
      result.postError = err.message;
    }
  }

  return result;
}

/**
 * Post tweet via Twitter API v2
 */
async function postTweet(text) {
  if (!TWITTER_ACCESS_TOKEN || !TWITTER_API_KEY) {
    logger.warn('Twitter API keys not configured — tweet queued but not posted');
    return { posted: false, queued: true };
  }

  // Twitter API v2 OAuth 1.0a signing
  const crypto = await import('crypto');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  const params = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  const baseString = 'POST&' +
    encodeURIComponent('https://api.twitter.com/2/tweets') + '&' +
    encodeURIComponent(Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&'));

  const signingKey = encodeURIComponent(TWITTER_API_SECRET) + '&' + encodeURIComponent(TWITTER_ACCESS_SECRET);
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  const authHeader = 'OAuth ' + Object.keys(params).sort().map(k =>
    `${k}="${encodeURIComponent(params[k])}"`
  ).join(', ') + `, oauth_signature="${encodeURIComponent(signature)}"`;

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Twitter API error: ${res.status} ${error}`);
  }

  return await res.json();
}

/**
 * Generate LinkedIn post
 */
export async function generateLinkedInPost() {
  const themes = [
    'a counterintuitive insight about AI agent economics',
    'lessons from analyzing costs across 200+ AI teams',
    'the organizational gap between AI spending and AI accountability',
    'why most AI ROI calculations are wrong and how to fix them',
  ];
  const theme = themes[Math.floor(Math.random() * themes.length)];
  return await generateContent('linkedin_post', theme);
}

/**
 * Generate content batch for all platforms
 */
export async function generateContentBatch() {
  logger.info('Starting content batch generation');

  const results = {
    tweets: [],
    instagram: null,
    linkedin: null,
    blog: null,
  };

  // Generate 3 tweets
  for (let i = 0; i < 3; i++) {
    const themes = [
      'a data point about AI waste that shocks CFOs',
      'a feature of layeroi that prevents cost disasters',
      'why existing monitoring tools fail finance teams',
    ];
    const tweet = await generateContent('tweet', themes[i]);
    results.tweets.push(tweet);
    await new Promise(r => setTimeout(r, 1500));
  }

  // Generate Instagram carousel
  results.instagram = await generateContent('instagram_carousel',
    'the real cost of running AI agents without financial visibility');
  await new Promise(r => setTimeout(r, 1500));

  // Generate LinkedIn post
  results.linkedin = await generateContent('linkedin_post',
    'what 200+ teams taught us about AI agent profitability');
  await new Promise(r => setTimeout(r, 1500));

  // Generate blog outline
  results.blog = await generateContent('blog_outline',
    'the complete guide to AI agent cost management for enterprises');

  const totalGenerated = results.tweets.filter(t => t.success).length +
    (results.instagram?.success ? 1 : 0) +
    (results.linkedin?.success ? 1 : 0) +
    (results.blog?.success ? 1 : 0);

  logger.info('Content batch complete', { totalGenerated });

  return { success: true, totalGenerated, results };
}
