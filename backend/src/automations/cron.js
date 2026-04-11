import cron from 'node-cron';
import { generateSEOArticle } from './seoEngine.js';
import { sendColdEmailSequence, checkClicksAndAlert } from './emailEngine.js';
import { checkFreeTierUpgradeTriggers } from './freeTierEngine.js';

let cronJobs = [];

export function initAutomations() {
  console.log('⏰ Initializing cron-based automations...');

  // SEO Article Generation: Every Tuesday and Friday at 10 AM UTC
  cronJobs.push(
    cron.schedule('0 10 * * 2,5', async () => {
      try {
        console.log('[CRON] Triggering SEO article generation...');
        await generateSEOArticle();
      } catch (err) {
        console.error('[CRON ERROR] SEO generation failed:', err.message);
      }
    })
  );

  // Cold Email Sequence: Every Monday at 8 AM UTC
  cronJobs.push(
    cron.schedule('0 8 * * 1', async () => {
      try {
        console.log('[CRON] Triggering cold email sequence...');
        await sendColdEmailSequence();
      } catch (err) {
        console.error('[CRON ERROR] Cold email failed:', err.message);
      }
    })
  );

  // Check Email Clicks and Hot Leads: Every 6 hours
  cronJobs.push(
    cron.schedule('0 */6 * * *', async () => {
      try {
        console.log('[CRON] Checking email clicks and intent...');
        await checkClicksAndAlert();
      } catch (err) {
        console.error('[CRON ERROR] Click check failed:', err.message);
      }
    })
  );

  // Free Tier Upgrade Triggers: Every 6 hours
  cronJobs.push(
    cron.schedule('0 */6 * * *', async () => {
      try {
        console.log('[CRON] Checking free tier upgrade triggers...');
        await checkFreeTierUpgradeTriggers();
      } catch (err) {
        console.error('[CRON ERROR] Free tier check failed:', err.message);
      }
    })
  );

  // Weekly Admin Report: Every Sunday at 9 AM UTC (uses dynamic import)
  cronJobs.push(
    cron.schedule('0 9 * * 0', async () => {
      try {
        console.log('[CRON] Sending weekly admin report...');
        // Dynamic import allows graceful handling if weeklyReport.js not yet created
        const { sendWeeklyAdminReport } = await import('./weeklyReport.js');
        await sendWeeklyAdminReport();
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
          console.warn('[CRON WARN] Weekly report module not yet available');
        } else {
          console.error('[CRON ERROR] Weekly report failed:', err.message);
        }
      }
    })
  );

  console.log(`✅ ${cronJobs.length} automation cron jobs scheduled`);
  console.log('   → SEO generation: Tue/Fri 10:00 UTC');
  console.log('   → Cold emails: Mon 08:00 UTC');
  console.log('   → Click checks: Every 6 hours');
  console.log('   → Free tier checks: Every 6 hours');
  console.log('   → Weekly reports: Sun 09:00 UTC');
}

export function stopAutomations() {
  cronJobs.forEach(job => job.stop());
  console.log('⏹ All automation cron jobs stopped');
}
