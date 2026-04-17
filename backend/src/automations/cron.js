import cron from 'node-cron';
import { generateSEOArticle } from './seoEngine.js';
import { sendColdEmailSequence, checkClicksAndAlert, processColdEmailSequence } from './emailEngine.js';
import { checkFreeTierUpgradeTriggers } from './freeTierEngine.js';
import {
  buildOutreachQueue,
  generateMessagesForQueue,
  sendOutreachEmails,
  sendFollowUpReminders,
} from './outreachEngine.js';
import { sendLaunchDayEmails, sendLaunchFollowUp } from './productHuntEngine.js';
import { sendPartnershipOutreach } from './partnershipEngine.js';
import { sendAcquisitionOutreach } from './acquisitionEngine.js';

let cronJobs = [];

export function initAutomations() {
  console.log('⏰ Initializing cron-based automations...');

  // SEO Article Generation: Monday, Wednesday, Friday at 9 AM UTC
  // Monday: Intent keywords (how-to, best practices)
  // Wednesday: Problem keywords (pain points, challenges)
  // Friday: Comparison keywords (vs competitors, alternatives)
  cronJobs.push(
    cron.schedule('0 9 * * 1', async () => {
      try {
        console.log('[CRON] Triggering SEO article generation (Intent keywords)...');
        await generateSEOArticle('intent');
      } catch (err) {
        console.error('[CRON ERROR] SEO generation failed:', err.message);
      }
    })
  );

  cronJobs.push(
    cron.schedule('0 9 * * 3', async () => {
      try {
        console.log('[CRON] Triggering SEO article generation (Problem keywords)...');
        await generateSEOArticle('problem');
      } catch (err) {
        console.error('[CRON ERROR] SEO generation failed:', err.message);
      }
    })
  );

  cronJobs.push(
    cron.schedule('0 9 * * 5', async () => {
      try {
        console.log('[CRON] Triggering SEO article generation (Comparison keywords)...');
        await generateSEOArticle('comparison');
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

  // Process Cold Email Sequence: Every day at 10 AM UTC (advance leads to next day)
  cronJobs.push(
    cron.schedule('0 10 * * *', async () => {
      try {
        console.log('[CRON] Processing cold email sequence...');
        await processColdEmailSequence();
      } catch (err) {
        console.error('[CRON ERROR] Cold email processing failed:', err.message);
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

  // Outreach Engine: Build queue every Monday at 12:30 AM UTC (6:00 AM IST)
  cronJobs.push(
    cron.schedule('30 0 * * 1', async () => {
      try {
        console.log('[CRON] Building outreach queue for the week...');
        const result = await buildOutreachQueue();
        console.log(`[CRON] Queue built: ${result.prospectCount} prospects added`);
      } catch (err) {
        console.error('[CRON ERROR] Outreach queue build failed:', err.message);
      }
    })
  );

  // Outreach Engine: Generate messages for pending prospects every Monday at 1:00 AM UTC (6:30 AM IST)
  cronJobs.push(
    cron.schedule('0 1 * * 1', async () => {
      try {
        console.log('[CRON] Generating personalized messages...');
        const result = await generateMessagesForQueue();
        console.log(`[CRON] Messages generated: ${result.messageCount}`);
      } catch (err) {
        console.error('[CRON ERROR] Message generation failed:', err.message);
      }
    })
  );

  // Outreach Engine: Send emails for queued prospects every Monday at 2:00 AM UTC (7:30 AM IST)
  cronJobs.push(
    cron.schedule('0 2 * * 1', async () => {
      try {
        console.log('[CRON] Sending outreach emails...');
        const result = await sendOutreachEmails();
        console.log(`[CRON] Emails sent: ${result.sentCount}`);
      } catch (err) {
        console.error('[CRON ERROR] Email sending failed:', err.message);
      }
    })
  );

  // Outreach Engine: Send follow-up reminders every Thursday at 12:30 AM UTC (6:00 AM IST)
  cronJobs.push(
    cron.schedule('30 0 * * 4', async () => {
      try {
        console.log('[CRON] Queueing follow-up reminders...');
        const result = await sendFollowUpReminders();
        console.log(`[CRON] Follow-ups queued: ${result.followUpCount}`);
      } catch (err) {
        console.error('[CRON ERROR] Follow-up queueing failed:', err.message);
      }
    })
  );

  // Product Hunt Launch: Send launch emails on first Monday of each quarter (April, July, Oct, Jan)
  cronJobs.push(
    cron.schedule('0 8 7-13 1,4,7,10 1', async () => {
      try {
        console.log('[CRON] Sending Product Hunt launch day emails...');
        const result = await sendLaunchDayEmails();
        console.log(`[CRON] Launch emails sent: ${result.sentCount}`);
      } catch (err) {
        console.error('[CRON ERROR] Product Hunt launch failed:', err.message);
      }
    })
  );

  // Product Hunt Follow-up: Send follow-up emails 3 days after launch
  cronJobs.push(
    cron.schedule('0 10 10-16 1,4,7,10 1', async () => {
      try {
        console.log('[CRON] Sending Product Hunt 3-day follow-up emails...');
        await sendLaunchFollowUp(3);
      } catch (err) {
        console.error('[CRON ERROR] Product Hunt follow-up failed:', err.message);
      }
    })
  );

  // Partnership Outreach: First business day of each month at 9 AM UTC
  cronJobs.push(
    cron.schedule('0 9 1-5 * 1-5', async () => {
      try {
        console.log('[CRON] Sending partnership outreach emails...');
        const result = await sendPartnershipOutreach();
        console.log(`[CRON] Partnership outreach sent: ${result.sentCount}`);
      } catch (err) {
        console.error('[CRON ERROR] Partnership outreach failed:', err.message);
      }
    })
  );

  // Acquisition Outreach: Quarterly on first Monday at 8 AM UTC
  cronJobs.push(
    cron.schedule('0 8 1-7 1,4,7,10 1', async () => {
      try {
        console.log('[CRON] Sending acquisition outreach emails...');
        const result = await sendAcquisitionOutreach();
        console.log(`[CRON] Acquisition outreach sent: ${result.sentCount}`);
      } catch (err) {
        console.error('[CRON ERROR] Acquisition outreach failed:', err.message);
      }
    })
  );

  console.log(`\n✅ ${cronJobs.length} TOTAL AUTOMATION CRON JOBS SCHEDULED\n`);
  console.log('📝 SEO & Content Generation:');
  console.log('   → Intent keywords: Mon 09:00 UTC');
  console.log('   → Problem keywords: Wed 09:00 UTC');
  console.log('   → Comparison keywords: Fri 09:00 UTC');
  console.log('\n📧 Email Sequences:');
  console.log('   → Cold email initiate: Mon 08:00 UTC');
  console.log('   → Cold email processing: Daily 10:00 UTC');
  console.log('   → Free tier triggers: Every 6 hours');
  console.log('   → Email engagement: Every 6 hours');
  console.log('\n👥 Outreach Automation:');
  console.log('   → Outreach queue build: Mon 00:30 UTC');
  console.log('   → Message generation: Mon 01:00 UTC');
  console.log('   → Email sending: Mon 02:00 UTC');
  console.log('   → Follow-up reminders: Thu 00:30 UTC');
  console.log('\n🚀 Growth & Partnership:');
  console.log('   → Product Hunt launch: 1st Mon of quarter 08:00 UTC');
  console.log('   → PH follow-ups: 3 days after launch');
  console.log('   → Partnership outreach: 1st weekday of month 09:00 UTC');
  console.log('   → Acquisition outreach: Quarterly 08:00 UTC');
  console.log('\n📊 Admin:');
  console.log('   → Weekly reports: Sun 09:00 UTC\n');
}

export function stopAutomations() {
  cronJobs.forEach(job => job.stop());
  console.log('⏹ All automation cron jobs stopped');
}
