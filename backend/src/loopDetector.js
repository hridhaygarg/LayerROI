const recentCalls = {};
const WINDOW_MS = 90 * 1000;
const MAX_CALLS = 15;

export function initLoopDetector() {
  setInterval(() => {
    const now = Date.now();
    for (const agent in recentCalls) {
      recentCalls[agent] = recentCalls[agent].filter(
        call => now - call.timestamp < WINDOW_MS
      );
      if (recentCalls[agent].length === 0) {
        delete recentCalls[agent];
      }
    }
  }, 120000);
}

export function checkRunawayLoop(agentName, messages) {
  const now = Date.now();

  if (!recentCalls[agentName]) {
    recentCalls[agentName] = [];
  }

  const callData = {
    timestamp: now,
    messageHash: hashMessages(messages),
    messages,
  };

  recentCalls[agentName].push(callData);

  recentCalls[agentName] = recentCalls[agentName].filter(
    call => now - call.timestamp < WINDOW_MS
  );

  if (recentCalls[agentName].length > MAX_CALLS) {
    const recentHashes = recentCalls[agentName].map(c => c.messageHash);
    const uniqueHashes = new Set(recentHashes);

    if (uniqueHashes.size < recentHashes.length * 0.2) {
      return {
        isLoop: true,
        reason: `${recentCalls[agentName].length} calls in 90s, mostly identical`,
        callCount: recentCalls[agentName].length,
      };
    }
  }

  return { isLoop: false };
}

function hashMessages(messages) {
  if (!Array.isArray(messages)) return '';
  return messages.map(m => `${m.role}:${m.content?.substring(0, 50)}`).join('|');
}

export function getAgentCallStats(agentName) {
  if (!recentCalls[agentName]) {
    return { agent: agentName, recentCalls: 0, windowSeconds: 90 };
  }

  return {
    agent: agentName,
    recentCalls: recentCalls[agentName].length,
    windowSeconds: 90,
    calls: recentCalls[agentName].map(c => ({
      timestamp: c.timestamp,
      hash: c.messageHash,
    })),
  };
}
