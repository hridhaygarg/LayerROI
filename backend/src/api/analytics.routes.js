import express from 'express';
import { getSupabaseClient } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate date range parameter
 * Accepts: 7d, 30d, 90d
 * Returns: number of days
 */
function validateDateRange(dateRange) {
  const range = dateRange || '30d';
  const validRanges = {
    '7d': 7,
    '30d': 30,
    '90d': 90
  };

  if (!validRanges[range]) {
    throw new AppError(
      'Invalid dateRange. Must be 7d, 30d, or 90d',
      400,
      'INVALID_INPUT'
    );
  }

  return validRanges[range];
}

/**
 * Validate prospect source parameter
 * Accepts: all, crunchbase, linkedin, api
 */
function validateProspectSource(source) {
  const source_param = source || 'all';
  const validSources = ['all', 'crunchbase', 'linkedin', 'api'];

  if (!validSources.includes(source_param)) {
    throw new AppError(
      'Invalid prospectSource. Must be all, crunchbase, linkedin, or api',
      400,
      'INVALID_INPUT'
    );
  }

  return source_param;
}

/**
 * Validate metric parameter
 * Accepts: outreach, engagement, conversion
 */
function validateMetric(metric) {
  const validMetrics = ['outreach', 'engagement', 'conversion'];

  if (!metric || !validMetrics.includes(metric)) {
    throw new AppError(
      'Invalid metric. Must be outreach, engagement, or conversion',
      400,
      'INVALID_INPUT'
    );
  }

  return metric;
}

/**
 * Validate aggregation parameter
 * Accepts: hourly, daily, weekly
 */
function validateAggregation(aggregation) {
  const agg = aggregation || 'daily';
  const validAggregations = ['hourly', 'daily', 'weekly'];

  if (!validAggregations.includes(agg)) {
    throw new AppError(
      'Invalid aggregation. Must be hourly, daily, or weekly',
      400,
      'INVALID_INPUT'
    );
  }

  return agg;
}

/**
 * Validate export format parameter
 * Accepts: csv, json, pdf
 */
function validateExportFormat(format) {
  const validFormats = ['csv', 'json', 'pdf'];

  if (!format || !validFormats.includes(format)) {
    throw new AppError(
      'Invalid format. Must be csv, json, or pdf',
      400,
      'INVALID_INPUT'
    );
  }

  return format;
}

/**
 * Validate export metric parameter
 * Accepts: all, outreach, engagement, conversion
 */
function validateExportMetric(metric) {
  const metric_param = metric || 'all';
  const validMetrics = ['all', 'outreach', 'engagement', 'conversion'];

  if (!validMetrics.includes(metric_param)) {
    throw new AppError(
      'Invalid metric. Must be all, outreach, engagement, or conversion',
      400,
      'INVALID_INPUT'
    );
  }

  return metric_param;
}

// ==================== DATE CALCULATION HELPERS ====================

/**
 * Calculate start date based on date range
 */
function getStartDate(days) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return startDate.toISOString();
}

// ==================== METRIC CALCULATION HELPERS ====================

/**
 * Calculate rate (e.g., open rate, click rate, reply rate)
 * Handles division by zero
 */
function calculateRate(numerator, denominator) {
  if (denominator === 0) return 0;
  return parseFloat((numerator / denominator).toFixed(2));
}

/**
 * Aggregate outreach status counts
 */
function aggregateOutreachCounts(statuses) {
  const counts = {
    sent: 0,
    opened: 0,
    clicked: 0,
    replied: 0
  };

  if (Array.isArray(statuses)) {
    statuses.forEach((item) => {
      if (item.status && item.count) {
        if (item.status === 'sent') counts.sent = item.count;
        else if (item.status === 'opened') counts.opened = item.count;
        else if (item.status === 'clicked') counts.clicked = item.count;
        else if (item.status === 'replied') counts.replied = item.count;
      }
    });
  }

  return counts;
}

// ==================== CSV GENERATION ====================

/**
 * Generate CSV content from data
 */
function generateCSV(data, headers) {
  if (!data || data.length === 0) {
    return headers.join(',');
  }

  const lines = [headers.join(',')];

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value).replace(/"/g, '""');
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    });
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

// ==================== GET /api/analytics/dashboard ====================
/**
 * GET /api/analytics/dashboard - Dashboard metrics
 * Query params:
 * - dateRange (7d, 30d, 90d; default: 30d)
 * - prospectSource (all, crunchbase, linkedin, api; default: all)
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const { dateRange, prospectSource } = req.query;
    const orgId = req.user.org_id;

    // Validate parameters
    const days = validateDateRange(dateRange);
    const source = validateProspectSource(prospectSource);
    const startDate = getStartDate(days);

    const supabase = getSupabaseClient();

    try {
      // ===== GET TOTAL PROSPECTS =====
      let prospectQuery = supabase
        .from('prospects')
        .select('count', { count: 'exact' })
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .gte('created_at', startDate);

      if (source !== 'all') {
        prospectQuery = prospectQuery.eq('source', source);
      }

      const { data: totalProspectsData, error: totalProspectsError } =
        await prospectQuery.single();

      if (totalProspectsError) {
        throw new AppError('Failed to fetch total prospects', 500, 'INTERNAL_ERROR');
      }

      const totalProspects = totalProspectsData?.count || 0;

      // ===== GET QUALIFIED PROSPECTS (icp_score > 0.5) =====
      let qualifiedQuery = supabase
        .from('prospects')
        .select('count', { count: 'exact' })
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .gte('icp_score', 0.5)
        .gte('created_at', startDate);

      if (source !== 'all') {
        qualifiedQuery = qualifiedQuery.eq('source', source);
      }

      const { data: qualifiedProspectsData, error: qualifiedProspectsError } =
        await qualifiedQuery.single();

      if (qualifiedProspectsError) {
        throw new AppError('Failed to fetch qualified prospects', 500, 'INTERNAL_ERROR');
      }

      const qualifiedProspects = qualifiedProspectsData?.count || 0;

      // ===== GET OUTREACH QUEUE STATS =====
      const { data: outreachStats, error: outreachError } = await supabase
        .from('outreach_queue')
        .select('status')
        .eq('org_id', orgId)
        .gte('created_at', startDate);

      if (outreachError) {
        throw new AppError('Failed to fetch outreach stats', 500, 'INTERNAL_ERROR');
      }

      // Count statuses
      const statusCounts = {
        sent: 0,
        opened: 0,
        clicked: 0,
        replied: 0
      };

      outreachStats.forEach((item) => {
        if (item.status === 'sent' || item.status === 'opened' || item.status === 'clicked')
          statusCounts.sent++;
        if (item.status === 'opened') statusCounts.opened++;
        if (item.status === 'clicked') statusCounts.clicked++;
        if (item.status === 'replied') statusCounts.replied++;
      });

      const totalOutreach = statusCounts.sent;
      const emailsSent = statusCounts.sent;
      const emailsOpened = statusCounts.opened;
      const emailsClicked = statusCounts.clicked;
      const replies = statusCounts.replied;

      // Calculate rates
      const openRate = calculateRate(emailsOpened, emailsSent);
      const clickRate = calculateRate(emailsClicked, emailsSent);
      const replyRate = calculateRate(replies, emailsSent);

      // ===== GET CONVERSIONS =====
      const { data: conversionData, error: conversionError } = await supabase
        .from('prospects')
        .select('count', { count: 'exact' })
        .eq('org_id', orgId)
        .eq('status', 'converted')
        .is('deleted_at', null)
        .gte('created_at', startDate)
        .single();

      if (conversionError) {
        throw new AppError('Failed to fetch conversions', 500, 'INTERNAL_ERROR');
      }

      const conversions = conversionData?.count || 0;
      const conversionRate = calculateRate(conversions, emailsSent);

      // ===== GET TOP COMPANIES =====
      const { data: topCompaniesData, error: topCompaniesError } = await supabase
        .from('prospects')
        .select('company')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .gte('created_at', startDate);

      if (topCompaniesError) {
        throw new AppError('Failed to fetch top companies', 500, 'INTERNAL_ERROR');
      }

      // Aggregate companies
      const companyMap = {};
      topCompaniesData.forEach((prospect) => {
        if (prospect.company) {
          if (!companyMap[prospect.company]) {
            companyMap[prospect.company] = { prospectCount: 0, conversionCount: 0 };
          }
          companyMap[prospect.company].prospectCount++;
        }
      });

      const topCompanies = Object.entries(companyMap)
        .map(([company, counts]) => ({
          company,
          prospectCount: counts.prospectCount,
          conversionCount: counts.conversionCount
        }))
        .sort((a, b) => b.prospectCount - a.prospectCount)
        .slice(0, 10);

      // ===== GET OUTREACH TREND (last 7 days) =====
      const sevenDaysAgo = getStartDate(7);
      const { data: trendData, error: trendError } = await supabase
        .from('outreach_queue')
        .select('created_at, sent_at, opened_at, clicked_at, replied_at')
        .eq('org_id', orgId)
        .gte('created_at', sevenDaysAgo);

      if (trendError) {
        throw new AppError('Failed to fetch trend data', 500, 'INTERNAL_ERROR');
      }

      // Aggregate by date
      const trendMap = {};
      trendData.forEach((item) => {
        const dateKey = new Date(item.created_at).toISOString().split('T')[0];

        if (!trendMap[dateKey]) {
          trendMap[dateKey] = {
            date: dateKey,
            sent: 0,
            opened: 0,
            clicked: 0,
            replied: 0
          };
        }

        if (item.sent_at) trendMap[dateKey].sent++;
        if (item.opened_at) trendMap[dateKey].opened++;
        if (item.clicked_at) trendMap[dateKey].clicked++;
        if (item.replied_at) trendMap[dateKey].replied++;
      });

      const outreachTrend = Object.values(trendMap)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7); // Last 7 days

      // ===== RETURN DASHBOARD METRICS =====
      res.json({
        success: true,
        metrics: {
          totalProspects,
          qualifiedProspects,
          totalOutreach,
          emailsSent,
          emailsOpened,
          openRate,
          emailsClicked,
          clickRate,
          replies,
          replyRate,
          conversions,
          conversionRate
        },
        topCompanies,
        outreachTrend
      });

      logger.info('Dashboard metrics retrieved', {
        orgId,
        dateRange,
        prospectSource: source,
        totalProspects,
        emailsSent
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Dashboard metrics error', { orgId, error: error.message });
      throw new AppError('Failed to retrieve dashboard metrics', 500, 'INTERNAL_ERROR');
    }
  })
);

// ==================== GET /api/analytics/metrics ====================
/**
 * GET /api/analytics/metrics - Detailed metrics
 * Query params:
 * - metric (outreach, engagement, conversion) - REQUIRED
 * - dateRange (7d, 30d, 90d; default: 30d)
 * - aggregation (hourly, daily, weekly; default: daily)
 */
router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const { metric, dateRange, aggregation } = req.query;
    const orgId = req.user.org_id;

    // Validate parameters
    const metricType = validateMetric(metric);
    const days = validateDateRange(dateRange);
    const agg = validateAggregation(aggregation);
    const startDate = getStartDate(days);

    const supabase = getSupabaseClient();

    try {
      let data = [];

      if (metricType === 'outreach') {
        // Fetch outreach data
        const { data: outreachData, error: outreachError } = await supabase
          .from('outreach_queue')
          .select('created_at, sent_at, opened_at, clicked_at')
          .eq('org_id', orgId)
          .gte('created_at', startDate);

        if (outreachError) {
          throw new AppError('Failed to fetch outreach metrics', 500, 'INTERNAL_ERROR');
        }

        // Aggregate based on aggregation type
        const aggregatedData = {};
        outreachData.forEach((item) => {
          let timeKey;

          if (agg === 'hourly') {
            timeKey = new Date(item.created_at).toISOString().slice(0, 13) + ':00:00Z';
          } else if (agg === 'daily') {
            timeKey = new Date(item.created_at).toISOString().split('T')[0];
          } else if (agg === 'weekly') {
            const date = new Date(item.created_at);
            const week = Math.floor((date.getDate() - date.getDay()) / 7);
            timeKey = `${date.getFullYear()}-W${week}`;
          }

          if (!aggregatedData[timeKey]) {
            aggregatedData[timeKey] = {
              time: timeKey,
              sent: 0,
              opened: 0,
              clicked: 0
            };
          }

          if (item.sent_at) aggregatedData[timeKey].sent++;
          if (item.opened_at) aggregatedData[timeKey].opened++;
          if (item.clicked_at) aggregatedData[timeKey].clicked++;
        });

        data = Object.values(aggregatedData).sort((a, b) =>
          a.time.localeCompare(b.time)
        );
      } else if (metricType === 'engagement') {
        // Fetch engagement data (opens and clicks)
        const { data: engagementData, error: engagementError } = await supabase
          .from('outreach_queue')
          .select('created_at, opened_at, clicked_at')
          .eq('org_id', orgId)
          .gte('created_at', startDate);

        if (engagementError) {
          throw new AppError('Failed to fetch engagement metrics', 500, 'INTERNAL_ERROR');
        }

        // Aggregate based on aggregation type
        const aggregatedData = {};
        engagementData.forEach((item) => {
          let timeKey;

          if (agg === 'hourly') {
            timeKey = new Date(item.created_at).toISOString().slice(0, 13) + ':00:00Z';
          } else if (agg === 'daily') {
            timeKey = new Date(item.created_at).toISOString().split('T')[0];
          } else if (agg === 'weekly') {
            const date = new Date(item.created_at);
            const week = Math.floor((date.getDate() - date.getDay()) / 7);
            timeKey = `${date.getFullYear()}-W${week}`;
          }

          if (!aggregatedData[timeKey]) {
            aggregatedData[timeKey] = {
              time: timeKey,
              opens: 0,
              clicks: 0
            };
          }

          if (item.opened_at) aggregatedData[timeKey].opens++;
          if (item.clicked_at) aggregatedData[timeKey].clicks++;
        });

        data = Object.values(aggregatedData).sort((a, b) =>
          a.time.localeCompare(b.time)
        );
      } else if (metricType === 'conversion') {
        // Fetch conversion data
        const { data: conversionData, error: conversionError } = await supabase
          .from('prospects')
          .select('created_at, updated_at, status')
          .eq('org_id', orgId)
          .eq('status', 'converted')
          .is('deleted_at', null)
          .gte('created_at', startDate);

        if (conversionError) {
          throw new AppError('Failed to fetch conversion metrics', 500, 'INTERNAL_ERROR');
        }

        // Aggregate based on aggregation type
        const aggregatedData = {};
        conversionData.forEach((item) => {
          let timeKey;

          if (agg === 'hourly') {
            timeKey = new Date(item.created_at).toISOString().slice(0, 13) + ':00:00Z';
          } else if (agg === 'daily') {
            timeKey = new Date(item.created_at).toISOString().split('T')[0];
          } else if (agg === 'weekly') {
            const date = new Date(item.created_at);
            const week = Math.floor((date.getDate() - date.getDay()) / 7);
            timeKey = `${date.getFullYear()}-W${week}`;
          }

          if (!aggregatedData[timeKey]) {
            aggregatedData[timeKey] = {
              time: timeKey,
              conversions: 0
            };
          }

          aggregatedData[timeKey].conversions++;
        });

        data = Object.values(aggregatedData).sort((a, b) =>
          a.time.localeCompare(b.time)
        );
      }

      res.json({
        success: true,
        metric: metricType,
        aggregation: agg,
        dateRange,
        data
      });

      logger.info('Detailed metrics retrieved', {
        orgId,
        metric: metricType,
        aggregation: agg,
        dateRange,
        dataPoints: data.length
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Metrics retrieval error', { orgId, metric, error: error.message });
      throw new AppError('Failed to retrieve metrics', 500, 'INTERNAL_ERROR');
    }
  })
);

// ==================== GET /api/analytics/export ====================
/**
 * GET /api/analytics/export - Export reports
 * Query params:
 * - format (csv, json, pdf) - REQUIRED
 * - metric (all, outreach, engagement, conversion; default: all)
 * - dateRange (7d, 30d, 90d; default: 30d)
 */
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const { format, metric, dateRange } = req.query;
    const orgId = req.user.org_id;

    // Validate parameters
    const exportFormat = validateExportFormat(format);
    const exportMetric = validateExportMetric(metric);
    const days = validateDateRange(dateRange);
    const startDate = getStartDate(days);

    const supabase = getSupabaseClient();

    try {
      // Collect all requested metrics
      const exportData = {};

      // ===== OUTREACH METRICS =====
      if (exportMetric === 'all' || exportMetric === 'outreach') {
        const { data: outreachData, error: outreachError } = await supabase
          .from('outreach_queue')
          .select('id, prospect_id, status, sent_at, opened_at, clicked_at, replied_at')
          .eq('org_id', orgId)
          .gte('created_at', startDate);

        if (outreachError) {
          throw new AppError('Failed to fetch outreach data', 500, 'INTERNAL_ERROR');
        }

        exportData.outreach = outreachData || [];
      }

      // ===== ENGAGEMENT METRICS =====
      if (exportMetric === 'all' || exportMetric === 'engagement') {
        const { data: engagementData, error: engagementError } = await supabase
          .from('email_events')
          .select('id, outreach_id, event_type, timestamp')
          .eq('org_id', orgId)
          .gte('created_at', startDate);

        if (engagementError) {
          logger.warn('Failed to fetch engagement events', { orgId });
        }

        exportData.engagement = engagementData || [];
      }

      // ===== CONVERSION METRICS =====
      if (exportMetric === 'all' || exportMetric === 'conversion') {
        const { data: conversionData, error: conversionError } = await supabase
          .from('prospects')
          .select('id, name, company, status, created_at, updated_at')
          .eq('org_id', orgId)
          .eq('status', 'converted')
          .is('deleted_at', null)
          .gte('created_at', startDate);

        if (conversionError) {
          throw new AppError('Failed to fetch conversion data', 500, 'INTERNAL_ERROR');
        }

        exportData.conversion = conversionData || [];
      }

      // ===== FORMAT AND RETURN =====
      if (exportFormat === 'json') {
        res.json({
          success: true,
          format: 'json',
          metric: exportMetric,
          dateRange,
          exportedAt: new Date().toISOString(),
          data: exportData
        });
      } else if (exportFormat === 'csv') {
        // Generate CSV for primary metric or all metrics
        let csvContent = '';
        let filename = `analytics_${exportMetric}_${new Date().toISOString().split('T')[0]}.csv`;

        if (exportMetric === 'all') {
          // Multi-section CSV
          if (exportData.outreach && exportData.outreach.length > 0) {
            csvContent +=
              'OUTREACH METRICS\n' +
              generateCSV(exportData.outreach, [
                'id',
                'prospect_id',
                'status',
                'sent_at',
                'opened_at',
                'clicked_at',
                'replied_at'
              ]) +
              '\n\n';
          }
          if (exportData.engagement && exportData.engagement.length > 0) {
            csvContent +=
              'ENGAGEMENT METRICS\n' +
              generateCSV(exportData.engagement, ['id', 'outreach_id', 'event_type', 'timestamp']) +
              '\n\n';
          }
          if (exportData.conversion && exportData.conversion.length > 0) {
            csvContent +=
              'CONVERSION METRICS\n' +
              generateCSV(exportData.conversion, ['id', 'name', 'company', 'status', 'created_at', 'updated_at']) +
              '\n\n';
          }
        } else if (exportMetric === 'outreach' && exportData.outreach) {
          csvContent = generateCSV(exportData.outreach, [
            'id',
            'prospect_id',
            'status',
            'sent_at',
            'opened_at',
            'clicked_at',
            'replied_at'
          ]);
        } else if (exportMetric === 'engagement' && exportData.engagement) {
          csvContent = generateCSV(exportData.engagement, [
            'id',
            'outreach_id',
            'event_type',
            'timestamp'
          ]);
        } else if (exportMetric === 'conversion' && exportData.conversion) {
          csvContent = generateCSV(exportData.conversion, [
            'id',
            'name',
            'company',
            'status',
            'created_at',
            'updated_at'
          ]);
        }

        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
      } else if (exportFormat === 'pdf') {
        // PDF export - for now return JSON representation
        // In production, use a library like pdf-lib or html-pdf
        logger.warn('PDF export requested - returning JSON instead', { orgId });
        res.json({
          success: true,
          format: 'pdf',
          metric: exportMetric,
          dateRange,
          exportedAt: new Date().toISOString(),
          message: 'PDF generation not yet implemented. Use JSON or CSV export instead.',
          data: exportData
        });
      }

      logger.info('Analytics export generated', {
        orgId,
        format: exportFormat,
        metric: exportMetric,
        dateRange
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Analytics export error', { orgId, format, metric, error: error.message });
      throw new AppError('Failed to generate export', 500, 'INTERNAL_ERROR');
    }
  })
);

export default router;
