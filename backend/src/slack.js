import fetch from 'node-fetch';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function sendSlackAlert(alert) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('[Slack Mock] Alert would be sent:', alert);
    return;
  }

  const message = {
    text: `🚨 AgentCFO Alert: Runaway Loop Detected`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Runaway Loop Detected*\nAgent: \`${alert.agent}\`\nReason: ${alert.reason}\nCalls in window: ${alert.callCount}`,
        },
      },
    ],
  };

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Slack alert failed:', response.status);
      return;
    }

    console.log(`[Slack] Alert sent for agent: ${alert.agent}`);
  } catch (error) {
    console.error('Slack error:', error);
  }
}

export async function sendSlackCostSummary(summary) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('[Slack Mock] Summary would be sent:', summary);
    return;
  }

  const agents = Object.keys(summary).map(agent => {
    const data = summary[agent];
    return `${agent}: $${data.totalCost} (${data.calls} calls)`;
  }).join('\n');

  const message = {
    text: `📊 AgentCFO Daily Summary`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Daily Cost Summary*\n\`\`\`\n${agents}\n\`\`\``,
        },
      },
    ],
  };

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Slack error:', error);
  }
}
