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

/**
 * @typedef {Object} Prospect
 * @property {string} id - UUID
 * @property {string} org_id - Organization ID
 * @property {string} name - Prospect name
 * @property {string} [title] - Job title
 * @property {string} email - Email address
 * @property {string} [phone] - Phone number
 * @property {string} [company] - Company name
 * @property {string} [industry] - Industry
 * @property {string} [website] - Company website
 * @property {string} [company_size] - Company size (e.g., 1-10, 11-50)
 * @property {string} [location] - Location
 * @property {string} [linkedin_url] - LinkedIn URL
 * @property {Object} research_data - Research metadata (JSONB)
 * @property {number} [icp_score] - ICP fit score (0-1)
 * @property {string} [fit_reason] - Why this prospect is a fit
 * @property {string} status - Status (new, contacted, interested, unqualified, replied)
 * @property {string} [source] - Where prospect came from (csv, api, web, automation)
 * @property {Date} created_at - Created timestamp
 * @property {Date} updated_at - Updated timestamp
 * @property {Date} [deleted_at] - Soft delete timestamp
 */

/**
 * @typedef {Object} OutreachQueue
 * @property {string} id - UUID
 * @property {string} org_id - Organization ID
 * @property {string} prospect_id - Prospect ID
 * @property {string} status - Status (pending, queued, sent, replied, failed, unsubscribed)
 * @property {string} [message] - Base message template
 * @property {string} [personalized_message] - Personalized version (AI-generated)
 * @property {Date} [generated_at] - When message was AI-generated
 * @property {number} version - Message version (for A/B testing)
 * @property {Date} [sent_at] - When email was sent
 * @property {Date} [opened_at] - When email was first opened
 * @property {Date} [clicked_at] - When link was first clicked
 * @property {Date} [replied_at] - When prospect replied
 * @property {string} [response_message] - Prospect's response text
 * @property {string} [queue_week] - Week for queue management (e.g., 2026-W16)
 * @property {number} attempt_count - Number of send attempts (for retries)
 * @property {string} [last_error] - Last error message (if failed)
 * @property {Date} created_at - Created timestamp
 * @property {Date} updated_at - Updated timestamp
 */

/**
 * @typedef {Object} EmailEvent
 * @property {string} id - UUID
 * @property {string} org_id - Organization ID
 * @property {string} outreach_id - Outreach queue ID
 * @property {string} event_type - Event type (opened, clicked, bounced, unsubscribed)
 * @property {Date} timestamp - Event timestamp
 * @property {string} [user_agent] - Recipient user agent
 * @property {Object} [location_data] - Geolocation data (JSONB)
 * @property {Date} created_at - Created timestamp
 */

export const PROSPECT_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  INTERESTED: 'interested',
  UNQUALIFIED: 'unqualified',
  REPLIED: 'replied'
};

export const OUTREACH_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  SENT: 'sent',
  REPLIED: 'replied',
  FAILED: 'failed',
  UNSUBSCRIBED: 'unsubscribed'
};

export const EMAIL_EVENTS = {
  OPENED: 'opened',
  CLICKED: 'clicked',
  BOUNCED: 'bounced',
  UNSUBSCRIBED: 'unsubscribed',
  COMPLAINED: 'complained'
};

export const COMPANY_SIZES = {
  STARTUP: '1-10',
  SMALL: '11-50',
  MEDIUM: '51-200',
  LARGE: '201-1000',
  ENTERPRISE: '1000+'
};
