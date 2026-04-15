/**
 * Core database schema type definitions
 * Used for JSDoc type hints and validation
 */

/**
 * @typedef {Object} User
 * @property {string} id - UUID
 * @property {string} email - Unique email address
 * @property {string} [password_hash] - Hashed password
 * @property {string} [first_name] - First name
 * @property {string} [last_name] - Last name
 * @property {string} [avatar_url] - Avatar URL
 * @property {string} timezone - Timezone (default UTC)
 * @property {string} language - Language code (default en)
 * @property {Date} created_at - Created timestamp
 * @property {Date} updated_at - Updated timestamp
 * @property {Date} [deleted_at] - Soft delete timestamp
 */

/**
 * @typedef {Object} Organization
 * @property {string} id - UUID
 * @property {string} name - Organization name
 * @property {string} [logo_url] - Logo URL
 * @property {string} created_by - User ID of creator
 * @property {string} subscription_tier - Subscription tier (free, pro, enterprise)
 * @property {string} subscription_status - Status (active, canceled, past_due)
 * @property {string} [stripe_customer_id] - Stripe customer ID
 * @property {Date} created_at - Created timestamp
 * @property {Date} updated_at - Updated timestamp
 * @property {Date} [deleted_at] - Soft delete timestamp
 */

/**
 * @typedef {Object} TeamMember
 * @property {string} id - UUID
 * @property {string} org_id - Organization ID
 * @property {string} user_id - User ID
 * @property {string} role - Role (owner, admin, lead, member, viewer)
 * @property {Date} created_at - Created timestamp
 * @property {Date} updated_at - Updated timestamp
 */

/**
 * @typedef {Object} ApiKey
 * @property {string} id - UUID
 * @property {string} org_id - Organization ID
 * @property {string} user_id - User ID
 * @property {string} name - Key name (user-facing)
 * @property {string} key_hash - SHA256 hash of key
 * @property {Array<string>} scopes - Permissions (read:*, write:*, etc)
 * @property {Date} [last_used_at] - Last usage timestamp
 * @property {Date} created_at - Created timestamp
 * @property {Date} expires_at - Expiration timestamp
 */

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  LEAD: 'lead',
  MEMBER: 'member',
  VIEWER: 'viewer'
};

export const ROLE_PERMISSIONS = {
  owner: ['*'],
  admin: ['read:*', 'write:*', 'delete:prospects', 'manage:team'],
  lead: ['read:*', 'write:outreach', 'read:analytics', 'manage:team_limited'],
  member: ['read:prospects', 'write:outreach', 'read:own_analytics'],
  viewer: ['read:dashboards', 'read:analytics']
};
