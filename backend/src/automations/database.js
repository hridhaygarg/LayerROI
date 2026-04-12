import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL: Missing Supabase credentials', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    providedUrl: supabaseUrl ? 'yes' : 'no',
    providedKey: supabaseKey ? 'yes' : 'no'
  });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function logContent(data) {
  const { error } = await supabase.from('seo_content').insert([{
    topic: data.topic,
    title: data.title,
    slug: data.slug,
    publish_date: data.publishDate,
    url: data.url,
  }]);
  if (error) console.error('Content log error:', error);
}

export async function getNextTopic() {
  // Rotate through topics
  const topics = [
    'how_to_calculate_ai_agent_roi',
    'enterprise_llm_cost_management',
    'ai_agent_spending_tracking',
    'openai_api_cost_attribution',
    'profitable_ai_agents',
    'ai_agent_budget_management',
    'llm_cost_per_task',
    'enterprise_ai_visibility',
    'ai_agent_financial_reporting',
    'measuring_automation_roi',
    'cost_optimisation_strategies',
    'cfo_guide_ai_spending',
    'ai_agent_governance',
  ];

  const lastPublished = await supabase
    .from('seo_content')
    .select('topic')
    .order('publish_date', { ascending: false })
    .limit(1)
    .single();

  const lastIndex = topics.indexOf(lastPublished?.data?.topic || topics[0]);
  return topics[(lastIndex + 1) % topics.length];
}

export async function logLead(data) {
  const { error } = await supabase.from('cold_email_leads').insert([{
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    company: data.company,
    title: data.title,
    sequence: data.sequence,
    sent_at: data.sentAt,
  }]);
  if (error) console.error('Lead log error:', error);
}

export async function checkLeadIntent() {
  const { data } = await supabase
    .from('cold_email_leads')
    .select('*')
    .eq('intent', 'hot')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function logUser(data) {
  const { data: user, error } = await supabase
    .from('free_tier_users')
    .insert([{
      name: data.name,
      email: data.email,
      company: data.company,
      api_key: data.apiKey,
      plan: data.plan,
      agent_limit: data.agentLimit,
      history_days: data.historyDays,
      created_at: data.createdAt,
    }])
    .select()
    .single();

  if (error) console.error('User log error:', error);
  return user;
}

export async function getUserAgentCount(userId) {
  const { data } = await supabase
    .from('api_calls')
    .select('agent_name')
    .eq('user_id', userId)
    .distinct();
  return data?.length || 0;
}

export async function getUserSpend(userId, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('api_calls')
    .select('cost_usd')
    .eq('user_id', userId)
    .gte('timestamp', startDate.toISOString());

  return data?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0;
}

export async function logCompanyVisit(data) {
  const { error } = await supabase.from('company_visits').insert([{
    company: data.company,
    page: data.page,
    timestamp: data.timestamp,
    ip: data.ip,
  }]);
  if (error) console.error('Visit log error:', error);
}

export async function checkHighIntentCompany(company) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data } = await supabase
    .from('company_visits')
    .select('page')
    .eq('company', company)
    .gte('timestamp', sevenDaysAgo.toISOString());

  const pages = [...new Set(data?.map(v => v.page))];

  return {
    visits: data?.length || 0,
    pages,
  };
}

export async function getTopAgent(userId) {
  const { data, error } = await supabase
    .from('api_calls')
    .select('agent_name, cost_usd')
    .eq('user_id', userId)
    .order('cost_usd', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return { name: data.agent_name, cost: data.cost_usd };
}
