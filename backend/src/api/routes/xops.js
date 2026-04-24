import express from 'express';
import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { generateDailyPosts, generateWeeklyThread, regeneratePost } from '../../automations/xContentEngine.js';

const router = express.Router();

async function requireSuperadmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Auth required' });

    const { verifyJWT } = await import('../../auth/jwt.js');
    const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const { data: user } = await supabase
      .from('users')
      .select('is_superadmin')
      .eq('id', decoded.userId)
      .single();

    if (!user?.is_superadmin) return res.status(403).json({ error: 'Forbidden' });
    req.userId = decoded.userId;
    req.orgId = decoded.orgId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Auth failed' });
  }
}

// GET /api/xops/posts
router.get('/api/xops/posts', requireSuperadmin, async (req, res) => {
  try {
    const status = req.query.status;
    let query = supabase.from('pending_posts').select('*').order('generated_at', { ascending: false }).limit(50);
    if (status && status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    logger.error('xops posts fetch error', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/xops/replies
router.get('/api/xops/replies', requireSuperadmin, async (req, res) => {
  try {
    const status = req.query.status;
    let query = supabase.from('pending_replies').select('*').order('generated_at', { ascending: false }).limit(50);
    if (status && status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/xops/dms
router.get('/api/xops/dms', requireSuperadmin, async (req, res) => {
  try {
    const status = req.query.status;
    let query = supabase.from('pending_dms').select('*').order('generated_at', { ascending: false }).limit(50);
    if (status && status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/xops/posts/:id/approve
router.post('/api/xops/posts/:id/approve', requireSuperadmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pending_posts')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;

    await supabase.from('x_ops_analytics').insert({
      action_type: 'approved', content_type: 'post', reference_id: req.params.id,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/xops/posts/:id/posted
router.post('/api/xops/posts/:id/posted', requireSuperadmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pending_posts')
      .update({ status: 'posted', posted_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;

    await supabase.from('x_ops_analytics').insert({
      action_type: 'posted', content_type: 'post', reference_id: req.params.id,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/xops/posts/:id/reject
router.post('/api/xops/posts/:id/reject', requireSuperadmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pending_posts')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;

    await supabase.from('x_ops_analytics').insert({
      action_type: 'rejected', content_type: 'post', reference_id: req.params.id,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/xops/posts/:id/regenerate
router.post('/api/xops/posts/:id/regenerate', requireSuperadmin, async (req, res) => {
  try {
    const data = await regeneratePost(req.params.id);

    await supabase.from('x_ops_analytics').insert({
      action_type: 'regenerated', content_type: 'post', reference_id: req.params.id,
    });

    res.json({ success: true, data });
  } catch (err) {
    logger.error('xops regenerate error', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/xops/generate — manual trigger
router.post('/api/xops/generate', requireSuperadmin, async (req, res) => {
  try {
    const posts = await generateDailyPosts();
    res.json({ success: true, data: posts, count: posts.length });
  } catch (err) {
    logger.error('xops generate error', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/xops/generate-thread — manual thread trigger
router.post('/api/xops/generate-thread', requireSuperadmin, async (req, res) => {
  try {
    const thread = await generateWeeklyThread();
    res.json({ success: true, data: thread });
  } catch (err) {
    logger.error('xops thread error', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/xops/stats
router.get('/api/xops/stats', requireSuperadmin, async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [pending, posted, threads, analytics] = await Promise.all([
      supabase.from('pending_posts').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      supabase.from('pending_posts').select('id', { count: 'exact', head: true }).eq('status', 'posted').gte('posted_at', weekAgo),
      supabase.from('pending_posts').select('id', { count: 'exact', head: true }).eq('post_type', 'thread'),
      supabase.from('x_ops_analytics').select('action_type', { count: 'exact', head: false }).gte('created_at', weekAgo),
    ]);

    res.json({
      success: true,
      data: {
        pending: pending.count || 0,
        posted_this_week: posted.count || 0,
        total_threads: threads.count || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
