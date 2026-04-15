import express from 'express';
import { getSupabaseClient } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * POST /api/prospects/bulk-import - Bulk import prospects from CSV
 * NOTE: Must be defined BEFORE /:id route to avoid route conflicts
 * Input: { prospects: [{ email, name, company, title, industry, location }] }
 * Validates all before creating any (all-or-nothing)
 */
router.post(
  '/bulk-import',
  asyncHandler(async (req, res) => {
    const { prospects: prospectsList } = req.body;
    const orgId = req.user.org_id;

    // Validate input
    if (!Array.isArray(prospectsList)) {
      throw new AppError('prospects must be an array', 400, 'INVALID_INPUT');
    }

    if (prospectsList.length === 0) {
      throw new AppError('prospects array cannot be empty', 400, 'INVALID_INPUT');
    }

    // Validate all prospects before creating any (all-or-nothing)
    const errors = [];
    const emailsInBatch = new Set();

    for (let i = 0; i < prospectsList.length; i++) {
      const prospect = prospectsList[i];

      // Validate required fields
      if (!prospect.email || !prospect.name) {
        errors.push({
          index: i,
          email: prospect.email || 'unknown',
          error: 'Email and name are required'
        });
        continue;
      }

      // Validate email format
      if (!isValidEmail(prospect.email)) {
        errors.push({
          index: i,
          email: prospect.email,
          error: 'Invalid email format'
        });
        continue;
      }

      // Check for duplicates within batch
      const emailLower = prospect.email.toLowerCase();
      if (emailsInBatch.has(emailLower)) {
        errors.push({
          index: i,
          email: prospect.email,
          error: 'Duplicate email within batch'
        });
        continue;
      }
      emailsInBatch.add(emailLower);
    }

    // If validation errors exist, return them (don't import anything)
    if (errors.length > 0) {
      throw new AppError('Validation failed for bulk import', 400, 'INVALID_INPUT', { errors });
    }

    const supabase = getSupabaseClient();

    try {
      // Check for existing emails in database using batch query with IN operator
      const existingEmails = new Set();
      if (prospectsList.length > 0) {
        const emailsToCheck = prospectsList.map(p => p.email.toLowerCase());
        const { data: existingProspects, error } = await supabase
          .from('prospects')
          .select('email')
          .eq('org_id', orgId)
          .in('email', emailsToCheck)
          .is('deleted_at', null);

        if (error && error.code !== 'PGRST116') {
          logger.error('Failed to check emails during bulk import', {
            orgId,
            count: emailsToCheck.length,
            error: error.message
          });
          throw new AppError('Failed to import prospects', 500);
        }

        if (existingProspects) {
          existingProspects.forEach(p => existingEmails.add(p.email.toLowerCase()));
        }
      }

      // Prepare prospects for insertion (skip existing emails)
      const prospectToCreate = prospectsList
        .filter(p => !existingEmails.has(p.email.toLowerCase()))
        .map(p => ({
          org_id: orgId,
          email: p.email.toLowerCase(),
          name: p.name,
          company: p.company || null,
          title: p.title || null,
          industry: p.industry || null,
          location: p.location || null,
          status: 'new'
        }));

      let createdCount = 0;
      let skippedCount = existingEmails.size;

      // Bulk insert new prospects
      if (prospectToCreate.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('prospects')
          .insert(prospectToCreate)
          .select();

        if (insertError) {
          logger.error('Failed to bulk insert prospects', {
            orgId,
            count: prospectToCreate.length,
            error: insertError.message
          });
          throw new AppError('Failed to import prospects', 500);
        }

        createdCount = inserted?.length || 0;
      }

      logger.info('Prospects bulk imported', {
        orgId,
        created: createdCount,
        skipped: skippedCount,
        total: prospectsList.length
      });

      res.status(200).json({
        created: createdCount,
        skipped: skippedCount,
        errors: []
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Unexpected error during bulk import', { error: err.message });
      throw new AppError('Failed to import prospects', 500);
    }
  })
);

/**
 * GET /api/prospects - List prospects with filtering and pagination
 * Query params:
 * - page (default: 1)
 * - limit (default: 20, max: 100)
 * - status (filter by status)
 * - search (search by email, name, company)
 * - sortBy (default: created_at)
 * - sortOrder (asc/desc, default: desc)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search, tags, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const orgId = req.user.org_id;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    let limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

    // Validate sortBy
    const validSortFields = ['created_at', 'updated_at', 'email', 'name'];
    if (!validSortFields.includes(sortBy)) {
      throw new AppError('Invalid sortBy field', 400, 'INVALID_INPUT');
    }

    // Validate sortOrder
    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      throw new AppError('Invalid sortOrder. Must be asc or desc', 400, 'INVALID_INPUT');
    }

    const supabase = getSupabaseClient();

    try {
      let query = supabase
        .from('prospects')
        .select('*', { count: 'exact' })
        .eq('org_id', orgId)
        .is('deleted_at', null); // Exclude soft-deleted

      // Apply status filter
      if (status) {
        query = query.eq('status', status);
      }

      // Apply search filter (case-insensitive across multiple fields)
      // Supabase client automatically escapes wildcard values in filters
      if (search && search.trim()) {
        const searchTerm = `%${search}%`;
        query = query.or(
          `email.ilike.${searchTerm},name.ilike.${searchTerm},company.ilike.${searchTerm}`
        );
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (pageNum - 1) * limitNum;
      const { data: prospects, error, count } = await query.range(offset, offset + limitNum - 1);

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to fetch prospects', {
          orgId,
          error: error.message
        });
        throw new AppError('Failed to fetch prospects', 500);
      }

      const total = count || 0;
      const hasMore = offset + limitNum < total;

      logger.debug('Prospects fetched', {
        orgId,
        total,
        returned: prospects?.length || 0
      });

      res.status(200).json({
        prospects: prospects || [],
        total,
        page: pageNum,
        limit: limitNum,
        hasMore
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Unexpected error fetching prospects', { error: err.message });
      throw new AppError('Failed to fetch prospects', 500);
    }
  })
);

/**
 * POST /api/prospects - Create new prospect
 * Input: { email, name, company, title, industry, location, phone, website }
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { email, name, company, title, industry, location, phone, website } = req.body;
    const orgId = req.user.org_id;

    // Normalize email immediately before any validation
    const normalizedEmail = email?.toLowerCase().trim();

    // Validate required fields
    if (!normalizedEmail || !name || name.trim().length === 0) {
      throw new AppError('Email and name are required', 400, 'INVALID_INPUT');
    }

    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      throw new AppError('Valid email is required', 400, 'INVALID_INPUT');
    }

    const supabase = getSupabaseClient();

    try {
      // Check if email already exists in organization (with normalized email)
      const { data: existingProspect, error: checkError } = await supabase
        .from('prospects')
        .select('id')
        .eq('org_id', orgId)
        .eq('email', normalizedEmail)
        .is('deleted_at', null)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        logger.error('Failed to check email existence', {
          orgId,
          email,
          error: checkError.message
        });
        throw new AppError('Failed to create prospect', 500);
      }

      if (existingProspect) {
        throw new AppError('Prospect with this email already exists', 409, 'DUPLICATE_EMAIL');
      }

      // Create new prospect with normalized email
      const { data: newProspect, error: createError } = await supabase
        .from('prospects')
        .insert([
          {
            org_id: orgId,
            email: normalizedEmail,
            name: name.trim(),
            company: company || null,
            title: title || null,
            industry: industry || null,
            location: location || null,
            phone: phone || null,
            website: website || null,
            status: 'new'
          }
        ])
        .select()
        .single();

      if (createError) {
        logger.error('Failed to create prospect', {
          orgId,
          email,
          error: createError.message
        });
        throw new AppError('Failed to create prospect', 500);
      }

      logger.info('Prospect created', {
        prospectId: newProspect.id,
        orgId,
        email
      });

      res.status(201).json({
        prospect: newProspect
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Unexpected error creating prospect', { error: err.message });
      throw new AppError('Failed to create prospect', 500);
    }
  })
);

/**
 * GET /api/prospects/:id - Get single prospect
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const supabase = getSupabaseClient();

    try {
      const { data: prospect, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('org_id', orgId)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to fetch prospect', {
          prospectId: id,
          orgId,
          error: error.message
        });
        throw new AppError('Failed to fetch prospect', 500);
      }

      if (!prospect) {
        throw new AppError('Prospect not found', 404, 'NOT_FOUND');
      }

      logger.debug('Prospect fetched', { prospectId: id, orgId });

      res.status(200).json({
        prospect
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Unexpected error fetching prospect', { error: err.message });
      throw new AppError('Failed to fetch prospect', 500);
    }
  })
);

/**
 * PATCH /api/prospects/:id - Update prospect
 * Input: { email, name, company, title, industry, location, phone, website, status }
 */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { email, name, company, title, industry, location, phone, website, status } = req.body;
    const orgId = req.user.org_id;

    const supabase = getSupabaseClient();

    try {
      // Fetch existing prospect
      const { data: existingProspect, error: fetchError } = await supabase
        .from('prospects')
        .select('*')
        .eq('org_id', orgId)
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        logger.error('Failed to fetch prospect for update', {
          prospectId: id,
          orgId,
          error: fetchError.message
        });
        throw new AppError('Failed to update prospect', 500);
      }

      if (!existingProspect) {
        throw new AppError('Prospect not found', 404, 'NOT_FOUND');
      }

      // Validate and normalize email if provided
      let normalizedEmail = null;
      if (email) {
        normalizedEmail = email.toLowerCase().trim();
        if (!isValidEmail(normalizedEmail)) {
          throw new AppError('Valid email is required', 400, 'INVALID_INPUT');
        }

        // Check for duplicate email if email is being changed (normalize for comparison)
        const existingEmail = existingProspect.email.toLowerCase();
        if (normalizedEmail !== existingEmail) {
          const { data: duplicateProspect, error: checkError } = await supabase
            .from('prospects')
            .select('id')
            .eq('org_id', orgId)
            .eq('email', normalizedEmail)
            .neq('id', id)
            .is('deleted_at', null)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            logger.error('Failed to check email uniqueness', {
              prospectId: id,
              orgId,
              email: normalizedEmail,
              error: checkError.message
            });
            throw new AppError('Failed to update prospect', 500);
          }

          if (duplicateProspect) {
            throw new AppError('Email already used by another prospect', 409, 'DUPLICATE_EMAIL');
          }
        }
      }

      // Build update object with only provided fields
      const updateData = {};
      if (normalizedEmail !== null) updateData.email = normalizedEmail;
      if (name !== undefined) updateData.name = name;
      if (company !== undefined) updateData.company = company;
      if (title !== undefined) updateData.title = title;
      if (industry !== undefined) updateData.industry = industry;
      if (location !== undefined) updateData.location = location;
      if (phone !== undefined) updateData.phone = phone;
      if (website !== undefined) updateData.website = website;
      if (status !== undefined) updateData.status = status;

      // Log status change
      if (status && status !== existingProspect.status) {
        logger.info('Prospect status changed', {
          prospectId: id,
          orgId,
          oldStatus: existingProspect.status,
          newStatus: status
        });
      }

      // Update prospect
      const { data: updatedProspect, error: updateError } = await supabase
        .from('prospects')
        .update(updateData)
        .eq('org_id', orgId)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to update prospect', {
          prospectId: id,
          orgId,
          error: updateError.message
        });
        throw new AppError('Failed to update prospect', 500);
      }

      logger.info('Prospect updated', {
        prospectId: id,
        orgId,
        updatedFields: Object.keys(updateData)
      });

      res.status(200).json({
        prospect: updatedProspect
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Unexpected error updating prospect', { error: err.message });
      throw new AppError('Failed to update prospect', 500);
    }
  })
);

/**
 * DELETE /api/prospects/:id - Soft delete prospect (mark as deleted)
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const supabase = getSupabaseClient();

    try {
      // Check if prospect exists
      const { data: prospect, error: fetchError } = await supabase
        .from('prospects')
        .select('id, email, status')
        .eq('org_id', orgId)
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        logger.error('Failed to fetch prospect for deletion', {
          prospectId: id,
          orgId,
          error: fetchError.message
        });
        throw new AppError('Failed to delete prospect', 500);
      }

      if (!prospect) {
        throw new AppError('Prospect not found', 404, 'NOT_FOUND');
      }

      // Soft delete (set deleted_at timestamp)
      const { data: deletedProspect, error: deleteError } = await supabase
        .from('prospects')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('org_id', orgId)
        .eq('id', id)
        .select()
        .single();

      if (deleteError) {
        logger.error('Failed to delete prospect', {
          prospectId: id,
          orgId,
          error: deleteError.message
        });
        throw new AppError('Failed to delete prospect', 500);
      }

      logger.info('Prospect deleted (soft delete)', {
        prospectId: id,
        orgId,
        email: prospect.email
      });

      res.status(200).json({
        message: 'Prospect deleted'
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Unexpected error deleting prospect', { error: err.message });
      throw new AppError('Failed to delete prospect', 500);
    }
  })
);

export const prospectsRoutes = router;
export default router;
