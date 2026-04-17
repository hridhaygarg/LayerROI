import express from 'express';
import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import {
  buildOutreachQueue,
  generateMessagesForQueue,
  sendOutreachEmails,
  sendFollowUpReminders,
} from '../../automations/outreachEngine.js';
import {
  initiateColdEmailSequence,
  processColdEmailSequence,
} from '../../automations/emailEngine.js';

const router = express.Router();

/**
 * GET /api/outreach
 * List all prospects in the queue with filtering and pagination
 */
router.get('/api/outreach', async (req, res) => {
  try {
    const { status = 'all', week = 'current', limit = 50, offset = 0 } = req.query;

    let query = supabase.from('outreach_queue').select('*', { count: 'exact' });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by week
    if (week !== 'all') {
      const weekNumber = week === 'current' ? getCurrentWeekNumber() : week;
      query = query.eq('queue_week', weekNumber);
    }

    // Apply pagination
    query = query.order('icp_score', { ascending: false }).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch outreach queue', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    logger.error('Outreach list endpoint error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/outreach/stats
 * Get statistics for the current outreach campaign
 */
router.get('/api/outreach/stats', async (req, res) => {
  try {
    const { data: statsData, error } = await supabase
      .from('outreach_stats')
      .select('*')
      .order('queue_week', { ascending: false })
      .limit(5);

    if (error) {
      logger.error('Failed to fetch outreach stats', error);
      return res.status(500).json({ error: error.message });
    }

    // Get current week stats
    const currentWeek = getCurrentWeekNumber();
    const currentStats = statsData?.[0] || {};

    // Get overall stats
    const { data: overallData } = await supabase.from('outreach_queue').select('*');

    const overallStats = {
      totalProspects: overallData?.length || 0,
      totalSent: overallData?.filter((p) => p.status === 'sent').length || 0,
      totalReplied: overallData?.filter((p) => p.response_received_at).length || 0,
      avgOpenRate: calculateAverageOpenRate(overallData),
      avgReplyRate: calculateAverageReplyRate(overallData),
    };

    res.json({
      success: true,
      currentWeek,
      currentWeekStats: currentStats,
      overallStats,
      recentWeeks: statsData || [],
    });
  } catch (err) {
    logger.error('Outreach stats endpoint error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/outreach/:id
 * Update prospect status or notes
 */
router.patch('/api/outreach/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, engagement_notes } = req.body;

    const updateData = { status_updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (engagement_notes) updateData.engagement_notes = engagement_notes;

    const { data, error } = await supabase.from('outreach_queue').update(updateData).eq('id', id).select().single();

    if (error) {
      logger.error('Failed to update outreach prospect', error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`Outreach prospect updated: ${id}`);
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Outreach update endpoint error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/outreach/run
 * Manual trigger to run the complete outreach workflow
 */
router.post('/api/outreach/run', async (req, res) => {
  try {
    logger.info('Manual outreach workflow triggered');

    // Step 1: Build queue
    const queueResult = await buildOutreachQueue();
    logger.info(`Queue build result: ${queueResult.prospectCount} prospects`);

    // Step 2: Generate messages
    const messageResult = await generateMessagesForQueue();
    logger.info(`Message generation result: ${messageResult.messageCount} messages`);

    // Step 3: Send emails
    const emailResult = await sendOutreachEmails();
    logger.info(`Email sending result: ${emailResult.sentCount} emails`);

    res.json({
      success: true,
      results: {
        queueBuilt: queueResult.prospectCount,
        messagesGenerated: messageResult.messageCount,
        emailsSent: emailResult.sentCount,
      },
      message: 'Outreach workflow completed successfully',
    });
  } catch (err) {
    logger.error('Outreach run endpoint error', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/outreach/follow-ups
 * Manual trigger to send follow-up reminders
 */
router.post('/api/outreach/follow-ups', async (req, res) => {
  try {
    logger.info('Manual follow-up trigger initiated');

    const result = await sendFollowUpReminders();
    logger.info(`Follow-ups queued: ${result.followUpCount}`);

    res.json({
      success: true,
      followUpsQueued: result.followUpCount,
      message: 'Follow-up workflow completed',
    });
  } catch (err) {
    logger.error('Follow-up endpoint error', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/cold-email/initiate
 * Start the cold email sequence with leads from Apollo
 */
router.post('/api/cold-email/initiate', async (req, res) => {
  try {
    logger.info('Cold email sequence initiated');

    await initiateColdEmailSequence();

    res.json({
      success: true,
      message: 'Cold email sequence started successfully',
    });
  } catch (err) {
    logger.error('Cold email initiate endpoint error', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/cold-email/process
 * Process next emails in the cold email sequence (should be called daily)
 */
router.post('/api/cold-email/process', async (req, res) => {
  try {
    logger.info('Processing cold email sequence');

    await processColdEmailSequence();

    res.json({
      success: true,
      message: 'Cold email sequence processed successfully',
    });
  } catch (err) {
    logger.error('Cold email process endpoint error', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/cold-email/stats
 * Get statistics for the cold email campaign
 */
router.get('/api/cold-email/stats', async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .from('cold_email_sequence_stats')
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to fetch cold email stats', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      data: stats || {},
    });
  } catch (err) {
    logger.error('Cold email stats endpoint error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cold-email/leads
 * List all cold email leads with filtering
 */
router.get('/api/cold-email/leads', async (req, res) => {
  try {
    const { sequence_day, responded, limit = 50, offset = 0 } = req.query;

    let query = supabase.from('cold_email_leads').select('*', { count: 'exact' });

    if (sequence_day !== undefined) {
      query = query.eq('sequence_day', parseInt(sequence_day));
    }

    if (responded === 'true') {
      query = query.not('response_received_at', 'is', null);
    }

    query = query.order('created_at', { ascending: false }).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch cold email leads', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    logger.error('Cold email leads endpoint error', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper functions

function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const week = Math.ceil(day / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function calculateAverageOpenRate(prospects) {
  if (!prospects || prospects.length === 0) return 0;
  const sent = prospects.filter((p) => p.status === 'sent');
  const opened = prospects.filter((p) => p.email_opened_at);
  return sent.length > 0 ? ((opened.length / sent.length) * 100).toFixed(1) : 0;
}

function calculateAverageReplyRate(prospects) {
  if (!prospects || prospects.length === 0) return 0;
  const sent = prospects.filter((p) => p.status === 'sent');
  const replied = prospects.filter((p) => p.response_received_at);
  return sent.length > 0 ? ((replied.length / sent.length) * 100).toFixed(1) : 0;
}

export default router;
