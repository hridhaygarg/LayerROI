import express from 'express';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// SEO Generation Cron Trigger
router.post('/automations/trigger/seo', async (req, res) => {
  try {
    const { keywordType } = req.body || {};
    const type = keywordType || 'intent';
    logger.info('SEO automation triggered', { type });

    const { generateSEOArticle } = await import('../../automations/seoEngine.js');
    await generateSEOArticle(type);

    res.json({ success: true, status: 'SEO article generation started', type });
  } catch (err) {
    logger.error('SEO automation failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Cold Email Sequence Cron Trigger
router.post('/automations/trigger/cold-email', async (req, res) => {
  try {
    logger.info('Cold email sequence automation triggered');

    const { sendColdEmailSequence, processColdEmailSequence, checkClicksAndAlert } = await import('../../automations/emailEngine.js');
    const result = await sendColdEmailSequence();

    res.json({ success: true, status: 'Cold email sequence started', result });
  } catch (err) {
    logger.error('Cold email automation failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Process Cold Email Sequence Cron Trigger
router.post('/automations/trigger/cold-email-process', async (req, res) => {
  try {
    logger.info('Processing cold email sequences');

    const { processColdEmailSequence } = await import('../../automations/emailEngine.js');
    await processColdEmailSequence();

    res.json({ success: true, status: 'Cold email sequences processed' });
  } catch (err) {
    logger.error('Cold email processing failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Email Engagement Check Cron Trigger
router.post('/automations/trigger/engagement-check', async (req, res) => {
  try {
    logger.info('Checking email engagement');

    const { checkClicksAndAlert } = await import('../../automations/emailEngine.js');
    await checkClicksAndAlert();

    res.json({ success: true, status: 'Email engagement checked' });
  } catch (err) {
    logger.error('Engagement check failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Free Tier Upgrade Triggers
router.post('/automations/trigger/free-tier', async (req, res) => {
  try {
    logger.info('Checking free tier upgrade triggers');

    const { checkFreeTierUpgradeTriggers } = await import('../../automations/freeTierEngine.js');
    const result = await checkFreeTierUpgradeTriggers();

    res.json({ success: true, status: 'Free tier checks completed', result });
  } catch (err) {
    logger.error('Free tier check failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Outreach Engine Triggers
router.post('/automations/trigger/outreach-build', async (req, res) => {
  try {
    logger.info('Building outreach queue');

    const { buildOutreachQueue } = await import('../../automations/outreachEngine.js');
    const result = await buildOutreachQueue();

    res.json({ success: true, status: 'Outreach queue built', result });
  } catch (err) {
    logger.error('Outreach build failed', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/automations/trigger/outreach-messages', async (req, res) => {
  try {
    logger.info('Generating outreach messages');

    const { generateMessagesForQueue } = await import('../../automations/outreachEngine.js');
    const result = await generateMessagesForQueue();

    res.json({ success: true, status: 'Messages generated', result });
  } catch (err) {
    logger.error('Message generation failed', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/automations/trigger/outreach-send', async (req, res) => {
  try {
    logger.info('Sending outreach emails');

    const { sendOutreachEmails } = await import('../../automations/outreachEngine.js');
    const result = await sendOutreachEmails();

    res.json({ success: true, status: 'Outreach emails sent', result });
  } catch (err) {
    logger.error('Email sending failed', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/automations/trigger/outreach-followup', async (req, res) => {
  try {
    logger.info('Sending follow-up reminders');

    const { sendFollowUpReminders } = await import('../../automations/outreachEngine.js');
    const result = await sendFollowUpReminders();

    res.json({ success: true, status: 'Follow-ups queued', result });
  } catch (err) {
    logger.error('Follow-up failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Partnership Outreach
router.post('/automations/trigger/partnership', async (req, res) => {
  try {
    logger.info('Sending partnership outreach');

    const { sendPartnershipOutreach } = await import('../../automations/partnershipEngine.js');
    const result = await sendPartnershipOutreach();

    res.json({ success: true, status: 'Partnership outreach sent', result });
  } catch (err) {
    logger.error('Partnership outreach failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Acquisition Outreach
router.post('/automations/trigger/acquisition', async (req, res) => {
  try {
    logger.info('Sending acquisition outreach');

    const { sendAcquisitionOutreach } = await import('../../automations/acquisitionEngine.js');
    const result = await sendAcquisitionOutreach();

    res.json({ success: true, status: 'Acquisition outreach sent', result });
  } catch (err) {
    logger.error('Acquisition outreach failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Product Hunt Launch
router.post('/automations/trigger/product-hunt-launch', async (req, res) => {
  try {
    logger.info('Sending Product Hunt launch emails');

    const { sendLaunchDayEmails } = await import('../../automations/productHuntEngine.js');
    const result = await sendLaunchDayEmails();

    res.json({ success: true, status: 'PH launch emails sent', result });
  } catch (err) {
    logger.error('PH launch failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Weekly Admin Report
router.post('/automations/trigger/weekly-report', async (req, res) => {
  try {
    logger.info('Sending weekly admin report');

    const { sendWeeklyAdminReport } = await import('../../automations/weeklyReport.js');
    const result = await sendWeeklyAdminReport();

    res.json({ success: true, status: 'Weekly report sent', result });
  } catch (err) {
    logger.error('Weekly report failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Marketing Engine Triggers
router.post('/automations/trigger/marketing-daily', async (req, res) => {
  try {
    logger.info('Daily marketing content generation triggered');
    const { generateDailyTweet } = await import('../../automations/marketingEngine.js');
    const result = await generateDailyTweet();
    res.json({ success: true, status: 'Daily tweet generated', result });
  } catch (err) {
    logger.error('Daily marketing failed', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/automations/trigger/marketing-weekly', async (req, res) => {
  try {
    logger.info('Weekly marketing content batch triggered');
    const { generateWeeklyContent } = await import('../../automations/marketingEngine.js');
    const result = await generateWeeklyContent();
    res.json({ success: true, status: 'Weekly content generated', result });
  } catch (err) {
    logger.error('Weekly marketing failed', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/automations/trigger/marketing-batch', async (req, res) => {
  try {
    logger.info('Marketing content batch triggered');
    const { generateContentBatch } = await import('../../automations/marketingEngine.js');
    const result = await generateContentBatch();
    res.json({ success: true, status: 'Content batch generated', result });
  } catch (err) {
    logger.error('Marketing batch failed', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/automations/trigger/marketing-generate', async (req, res) => {
  try {
    const { type, theme } = req.body || {};
    if (!type || !theme) {
      return res.status(400).json({ error: 'type and theme are required' });
    }
    logger.info('Custom content generation triggered', { type, theme });
    const { generateContent } = await import('../../automations/marketingEngine.js');
    const result = await generateContent(type, theme);
    res.json({ success: true, result });
  } catch (err) {
    logger.error('Custom content generation failed', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/automations/trigger/linkedin-post', async (req, res) => {
  try {
    logger.info('LinkedIn post generation triggered');
    const { generateLinkedInPost } = await import('../../automations/marketingEngine.js');
    const result = await generateLinkedInPost();
    res.json({ success: true, status: 'LinkedIn post generated', result });
  } catch (err) {
    logger.error('LinkedIn post generation failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Legacy endpoints for backward compatibility
router.post('/automations/seo', (req, res) => {
  logger.info('SEO automation triggered (legacy)');
  res.json({ status: 'SEO article generation queued', message: 'Will generate and publish to GitHub' });
});

router.post('/automations/email', (req, res) => {
  logger.info('Email automation triggered (legacy)');
  res.json({ status: 'Cold email sequence started', leads: 50, emailsSent: 'Day 0 sequence' });
});

router.post('/automations/free-tier', (req, res) => {
  logger.info('Free tier automation triggered (legacy)');
  res.json({ status: 'Free tier checks running', usersChecked: 'all', emailsSent: 0 });
});

router.post('/automations/intent', (req, res) => {
  logger.info('Intent detection automation triggered (legacy)');
  res.json({ status: 'Intent detection running', companiesFound: 0, alertsSent: 0 });
});

export default router;
