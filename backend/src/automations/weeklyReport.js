import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function sendWeeklyAdminReport() {
  try {
    // Get metrics from past 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // User signup metrics
    const { data: newUsers, error: userError } = await supabase
      .from('users')
      .select('id, email, company')
      .gte('created_at', sevenDaysAgo.toISOString());

    const newUserCount = newUsers?.length || 0;

    // API call metrics
    const { data: apiCalls, error: callError } = await supabase
      .from('api_calls')
      .select('cost_usd, model')
      .gte('created_at', sevenDaysAgo.toISOString());

    const totalCost = apiCalls?.reduce((sum, call) => sum + (call.cost_usd || 0), 0) || 0;
    const totalCalls = apiCalls?.length || 0;

    // Active agents
    const { data: agents } = await supabase
      .from('api_calls')
      .select('agent_name', { count: 'exact' })
      .gte('created_at', sevenDaysAgo.toISOString())
      .distinct();

    const activeAgents = agents?.length || 0;

    // High intent leads (companies that visited 3+ times)
    const { data: visits } = await supabase
      .from('company_visits')
      .select('company')
      .gte('created_at', sevenDaysAgo.toISOString());

    const intentCompanies = new Map();
    visits?.forEach(visit => {
      intentCompanies.set(visit.company, (intentCompanies.get(visit.company) || 0) + 1);
    });

    const highIntentCount = Array.from(intentCompanies.values()).filter(count => count >= 3).length;

    // Free tier conversions
    const { data: upgradeEvents } = await supabase
      .from('events')
      .select('*')
      .eq('event_type', 'upgrade')
      .gte('created_at', sevenDaysAgo.toISOString());

    const upgrades = upgradeEvents?.length || 0;

    // Send report to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'founder@layeroi.com';

    await resend.emails.send({
      from: 'reports@layerROI.com',
      to: adminEmail,
      subject: `📊 Layer ROI Weekly Report – ${new Date().toLocaleDateString()}`,
      html: `
        <h1>Layer ROI Weekly Report</h1>
        <p>Week of ${sevenDaysAgo.toLocaleDateString()} – ${new Date().toLocaleDateString()}</p>

        <h2>📈 Key Metrics</h2>
        <ul>
          <li><strong>New Signups:</strong> ${newUserCount} users</li>
          <li><strong>API Calls:</strong> ${totalCalls} calls</li>
          <li><strong>Total Cost Tracked:</strong> $${totalCost.toFixed(2)}</li>
          <li><strong>Active Agents:</strong> ${activeAgents}</li>
          <li><strong>High-Intent Companies:</strong> ${highIntentCount} (3+ visits)</li>
          <li><strong>Upgrades to Paid:</strong> ${upgrades} conversions</li>
        </ul>

        <h2>👥 New Users This Week</h2>
        ${newUsers && newUsers.length > 0 ? `
          <ul>
            ${newUsers.slice(0, 10).map(user => `
              <li>${user.email} from ${user.company || 'Unknown'}</li>
            `).join('')}
          </ul>
        ` : '<p>No new signups this week.</p>'}

        <h2>🔥 High-Intent Companies</h2>
        ${Array.from(intentCompanies.entries())
          .filter(([_, count]) => count >= 3)
          .slice(0, 10)
          .map(([company, count]) => `<li>${company}: ${count} visits</li>`)
          .join('') || '<p>No high-intent companies detected.</p>'}

        <hr />
        <p><small>Generated automatically by Layer ROI automation system</small></p>
      `,
    });

    console.log(`✅ Weekly report sent to ${adminEmail}`);
    console.log(`   → New signups: ${newUserCount}`);
    console.log(`   → API calls: ${totalCalls}`);
    console.log(`   → Total cost tracked: $${totalCost.toFixed(2)}`);
    console.log(`   → Upgrades: ${upgrades}`);

  } catch (err) {
    console.error('❌ Failed to send weekly report:', err.message);
  }
}

export async function getMetricsSummary() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { data: newUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact' })
    .gte('created_at', sevenDaysAgo.toISOString());

  const { data: apiCalls } = await supabase
    .from('api_calls')
    .select('cost_usd', { count: 'exact' })
    .gte('created_at', sevenDaysAgo.toISOString());

  const totalCost = apiCalls?.reduce((sum, call) => sum + (call.cost_usd || 0), 0) || 0;

  return {
    newUsers: newUsers?.length || 0,
    apiCalls: apiCalls?.length || 0,
    totalCost: totalCost.toFixed(2),
    timestamp: new Date().toISOString(),
  };
}
