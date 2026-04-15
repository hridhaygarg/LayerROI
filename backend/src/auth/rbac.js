import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { ROLE_PERMISSIONS } from '../db/schema.js';

/**
 * Check if user has required permission
 * @param {Object} user - User object with role
 * @param {string} requiredPermission - Permission to check (e.g., 'write:prospects')
 * @returns {boolean} True if user has permission
 */
export function hasPermission(user, requiredPermission) {
  if (!user || !user.role) return false;

  const permissions = ROLE_PERMISSIONS[user.role] || [];

  // Owner and admin bypass all checks
  if (permissions.includes('*')) return true;

  // Check exact permission or wildcard match
  return permissions.some(perm =>
    perm === requiredPermission ||
    (perm.endsWith(':*') && requiredPermission.startsWith(perm.slice(0, -1)))
  );
}

/**
 * Middleware to enforce permission requirement
 * @param {string} requiredPermission - Permission to check
 * @returns {Function} Express middleware
 */
export function requirePermission(requiredPermission) {
  return (req, res, next) => {
    const user = req.user;

    if (!hasPermission(user, requiredPermission)) {
      logger.warn('Permission denied', {
        user_id: user?.id,
        required: requiredPermission,
        user_role: user?.role
      });

      return next(new AppError(
        'Access denied',
        403,
        'FORBIDDEN'
      ));
    }

    next();
  };
}

export default { hasPermission, requirePermission };
