-- Webhooks table for webhook management
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url VARCHAR(2000) NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  signing_secret VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  last_delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(org_id, url) WHERE deleted_at IS NULL
);

CREATE INDEX idx_webhooks_org_status ON webhooks(org_id, status);
CREATE INDEX idx_webhooks_created_at ON webhooks(created_at);

-- Webhook logs table for delivery tracking
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'success',
  http_status INTEGER,
  response_time INTEGER,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_logs_webhook ON webhook_logs(webhook_id, created_at);
CREATE INDEX idx_webhook_logs_org ON webhook_logs(org_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Auto-update timestamps for webhooks
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row-level security for webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhooks_read ON webhooks
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM team_members WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- Row-level security for webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_logs_read ON webhook_logs
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM team_members WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );
