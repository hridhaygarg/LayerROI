-- Create cold_email_leads table for tracking email sequence progress
CREATE TABLE IF NOT EXISTS cold_email_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  title VARCHAR(255),
  sequence_day INTEGER NOT NULL DEFAULT 0,
  sent_emails INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  response_received_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_cold_email_leads_email ON cold_email_leads(email);
CREATE INDEX idx_cold_email_leads_scheduled_for ON cold_email_leads(scheduled_for);
CREATE INDEX idx_cold_email_leads_sequence_day ON cold_email_leads(sequence_day);
CREATE INDEX idx_cold_email_leads_company_name ON cold_email_leads(company_name);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cold_email_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cold_email_leads_updated_at_trigger
BEFORE UPDATE ON cold_email_leads
FOR EACH ROW
EXECUTE FUNCTION update_cold_email_leads_updated_at();

-- Create view for sequence statistics
CREATE OR REPLACE VIEW cold_email_sequence_stats AS
SELECT
  COUNT(*) as total_leads,
  COUNT(CASE WHEN sequence_day = 0 THEN 1 END) as day_0_pending,
  COUNT(CASE WHEN sequence_day = 3 THEN 1 END) as day_3_pending,
  COUNT(CASE WHEN sequence_day = 7 THEN 1 END) as day_7_pending,
  COUNT(CASE WHEN sequence_day = 14 THEN 1 END) as day_14_pending,
  COUNT(CASE WHEN sequence_day = 21 THEN 1 END) as day_21_completed,
  COUNT(CASE WHEN response_received_at IS NOT NULL THEN 1 END) as responded,
  COUNT(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 END) as unsubscribed
FROM cold_email_leads;
