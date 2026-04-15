-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Organizations (workspaces)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_team_members_org_id ON team_members(org_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  scopes JSON DEFAULT '[]',
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_read_self ON users
  FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY organizations_read ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM team_members WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

CREATE POLICY team_members_read ON team_members
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM team_members WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- ==================== PROSPECTS & OUTREACH ====================

-- Prospects table (deduplicated across integrations)
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  industry VARCHAR(100),
  website VARCHAR(255),
  company_size VARCHAR(50),
  location VARCHAR(255),
  linkedin_url TEXT,
  research_data JSONB DEFAULT '{}'::jsonb,
  icp_score NUMERIC(3,2) CHECK (icp_score >= 0 AND icp_score <= 1.0),
  fit_reason TEXT,
  status VARCHAR(50) DEFAULT 'new',
  source VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(org_id, email) WHERE deleted_at IS NULL
);

CREATE INDEX idx_prospects_org_status ON prospects(org_id, status);
CREATE INDEX idx_prospects_email ON prospects(email);
CREATE INDEX idx_prospects_created_at ON prospects(created_at);
CREATE INDEX idx_prospects_icp_score ON prospects(icp_score DESC);
CREATE INDEX idx_prospects_fts ON prospects USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(company, '') || ' ' || COALESCE(research_data::text, ''))
);

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Outreach queue (partitioned by date for 10M+ row scale)
CREATE TABLE outreach_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  message TEXT,
  personalized_message TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  response_message TEXT,
  queue_week VARCHAR(20),
  attempt_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Partitions for current and next 12 months
CREATE TABLE outreach_queue_2026_04 PARTITION OF outreach_queue
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE outreach_queue_2026_05 PARTITION OF outreach_queue
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE outreach_queue_2026_06 PARTITION OF outreach_queue
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE outreach_queue_2026_07 PARTITION OF outreach_queue
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE outreach_queue_2026_08 PARTITION OF outreach_queue
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE outreach_queue_2026_09 PARTITION OF outreach_queue
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE outreach_queue_2026_10 PARTITION OF outreach_queue
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE outreach_queue_2026_11 PARTITION OF outreach_queue
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE outreach_queue_2026_12 PARTITION OF outreach_queue
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE outreach_queue_2027_01 PARTITION OF outreach_queue
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE outreach_queue_2027_02 PARTITION OF outreach_queue
  FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
CREATE TABLE outreach_queue_2027_03 PARTITION OF outreach_queue
  FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');

CREATE INDEX idx_outreach_org_status ON outreach_queue(org_id, status);
CREATE INDEX idx_outreach_prospect ON outreach_queue(prospect_id);
CREATE INDEX idx_outreach_sent ON outreach_queue(sent_at, opened_at);
CREATE INDEX idx_outreach_queue_week ON outreach_queue(queue_week);
CREATE INDEX idx_outreach_created ON outreach_queue(created_at);

CREATE TRIGGER update_outreach_queue_updated_at BEFORE UPDATE ON outreach_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Email events for tracking opens, clicks, replies
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  outreach_id UUID NOT NULL REFERENCES outreach_queue(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_events_outreach ON email_events(outreach_id, event_type);
CREATE INDEX idx_email_events_created ON email_events(created_at);

-- RLS for prospects
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY prospects_read ON prospects
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM team_members WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- RLS for outreach_queue
ALTER TABLE outreach_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY outreach_queue_read ON outreach_queue
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM team_members WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- RLS for email_events
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_events_read ON email_events
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM team_members WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );
