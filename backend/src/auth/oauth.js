import { getSupabaseClient } from '../db/client.js';
import { generateTokens } from './jwt.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Handle OAuth callback and create/update user
 * @param {string} provider - OAuth provider (google, github, microsoft)
 * @param {Object} profile - User profile from OAuth provider
 * @returns {Object} { user, tokens }
 */
export async function handleOAuthCallback(provider, profile) {
  const supabase = getSupabaseClient();

  try {
    // Check if user exists by email
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', profile.email)
      .single();

    let user = existingUser;

    if (!user) {
      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: profile.email,
          first_name: profile.given_name || profile.name,
          last_name: profile.family_name,
          avatar_url: profile.picture,
          oauth_provider: provider,
          oauth_id: profile.sub || profile.id
        }])
        .select()
        .single();

      if (error) throw error;
      user = newUser;

      // Create default organization
      const { data: org } = await supabase
        .from('organizations')
        .insert([{
          name: `${user.first_name}'s Workspace`,
          created_by: user.id
        }])
        .select()
        .single();

      // Add user to organization
      await supabase
        .from('team_members')
        .insert([{
          org_id: org.id,
          user_id: user.id,
          role: 'owner'
        }]);
    }

    const tokens = generateTokens(user);

    logger.info('OAuth authentication successful', {
      provider,
      email: user.email,
      user_id: user.id
    });

    return { user, tokens };
  } catch (err) {
    logger.error('OAuth callback failed', {
      provider,
      error: err.message
    });
    throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
  }
}

export default { handleOAuthCallback };
