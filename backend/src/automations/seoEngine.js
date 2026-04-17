import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import { logContent, getNextTopic } from './database.js';

const client = new Anthropic();

// Article topics organized by keyword intent
const seoTopics = {
  // Monday: Intent keywords (how-to, best practices, guides)
  intent: {
    'how_to_calculate_ai_agent_roi': 'How to Calculate ROI for Your AI Agents',
    'ai_agent_spending_tracking': 'AI Agent Spending Tracking Best Practices',
    'measuring_automation_roi': 'Measuring AI Automation ROI',
    'ai_agent_budget_management': 'AI Agent Budget Management',
    'enterprise_ai_visibility': 'Enterprise AI Spending Visibility',
    'cfo_guide_ai_spending': 'CFO Guide to AI Agent Spending',
  },
  // Wednesday: Problem keywords (pain points, challenges, solutions)
  problem: {
    'profitable_ai_agents': 'How to Know If Your AI Agents Are Profitable',
    'enterprise_llm_cost_management': 'Enterprise LLM Cost Management Guide',
    'openai_api_cost_attribution': 'OpenAI API Cost Attribution for Enterprises',
    'llm_cost_per_task': 'LLM Cost Per Task Calculation',
    'ai_agent_financial_reporting': 'AI Agent Financial Reporting',
    'ai_agent_governance': 'AI Agent Governance and Cost Control',
  },
  // Friday: Comparison keywords (vs competitors, alternatives, comparisons)
  comparison: {
    'layeroi_vs_datadog': 'layeroi vs Datadog: AI Agent Cost Tracking Comparison',
    'layeroi_vs_observability': 'Why Observability Tools Miss AI Agent ROI',
    'best_ai_cost_tracking': 'Best Practices for AI Cost Tracking in 2026',
    'cost_optimisation_strategies': 'AI Agent Cost Optimisation Strategies',
    'ai_agent_monitoring': 'Monitoring AI Agent Performance and Costs',
    'enterprise_ai_automation': 'Enterprise AI Automation ROI Management',
  },
};

export async function generateSEOArticle(dayOfWeek = null) {
  // Determine day of week if not provided
  if (dayOfWeek === null) {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (day === 1) {
      dayOfWeek = 'intent';
    } else if (day === 3) {
      dayOfWeek = 'problem';
    } else if (day === 5) {
      dayOfWeek = 'comparison';
    } else {
      // Default to intent for other days
      dayOfWeek = 'intent';
    }
  }

  // Get random topic from the day's category
  const topicPool = seoTopics[dayOfWeek] || seoTopics.intent;
  const topicKeys = Object.keys(topicPool);
  const topic = topicKeys[Math.floor(Math.random() * topicKeys.length)];
  const topics = topicPool;
  const title = topics[topic];

  // Create intent-specific prompt instructions
  let intentInstructions = '';
  if (dayOfWeek === 'intent') {
    intentInstructions = `
This is a "how-to" / "best practices" article targeting engineers who want to understand AI agent ROI.
Focus on practical guides, step-by-step instructions, and actionable advice.
Target audience: CTOs, VP Engineering, Engineering Leads making budgeting decisions.
Use clear examples and frameworks that apply to their infrastructure.`;
  } else if (dayOfWeek === 'problem') {
    intentInstructions = `
This is a "problem-focused" article targeting the pain point: not knowing which AI agents are profitable.
Focus on the challenge, impact, and why it matters to engineering leadership.
Include statistics about AI spending waste and common mistakes.
Target audience: CFOs, VPs concerned about AI infrastructure costs.
Frame the problem as unsolved by existing tools.`;
  } else if (dayOfWeek === 'comparison') {
    intentInstructions = `
This is a "comparison" article comparing layeroi's approach to other solutions.
Position layeroi as purpose-built for AI agent ROI (not general observability).
Highlight what makes it different: agent-level P&L, not just infrastructure metrics.
Target audience: Technical decision makers evaluating cost management tools.
Be fair to competitors but clear on what's unique about agent ROI tracking.`;
  }

  const prompt = `Write a compelling 1,200-word article about "${title}".

${intentInstructions}

Include:
- Compelling headline
- Engaging introduction (2-3 sentences)
- 4-5 sections with subheadings
- Real data points and examples (cite sources like Deloitte, Gartner, or industry benchmarks)
- Actionable insights or frameworks
- Conclusion with CTA to try layeroi

Format as HTML. Include these CTA elements:
<p>Ready to optimize your AI agent spending? <a href="https://layeroi.com">Try layeroi free</a> — 15 minutes to financial visibility.</p>

Return ONLY the HTML content, no markdown or extra text.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const htmlContent = message.content[0].text;
  const slug = topic.replace(/_/g, '-');
  const filename = `frontend/public/blog/${slug}.html`;

  // Write file
  await new Promise((resolve, reject) => {
    const fs = require('fs');
    fs.writeFile(filename, `
<!DOCTYPE html>
<html>
<head>
  <title>${title} | layeroi</title>
  <meta name="description" content="Learn about ${title.toLowerCase()} with layeroi's expert guide.">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="Learn about ${title.toLowerCase()} with layeroi.">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #C8F264; }
    a { color: #C8F264; }
  </style>
</head>
<body>
  <a href="/">← Back to layeroi</a>
  ${htmlContent}
</body>
</html>
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Commit and push
  execSync(`git add ${filename}`);
  execSync(`git commit -m "content: publish SEO article - ${title}"`);
  execSync(`git push https://hridhaygarg:${process.env.GITHUB_TOKEN}@github.com/hridhaygarg/layeroi.git main`);

  // Log to database
  await logContent({
    topic,
    title,
    slug,
    publishDate: new Date(),
    url: `https://layeroi.com/blog/${slug}.html`,
  });

  console.log(`✅ Published: ${title}`);
}
