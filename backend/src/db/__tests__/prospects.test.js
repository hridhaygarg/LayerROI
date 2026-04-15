import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  PROSPECT_STATUS,
  OUTREACH_STATUS,
  EMAIL_EVENTS,
  COMPANY_SIZES
} from '../schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Prospects & Outreach Schema', () => {
  describe('Schema Type Definitions', () => {
    it('should export prospect status constants', () => {
      expect(PROSPECT_STATUS).toBeDefined();
      expect(PROSPECT_STATUS.NEW).toBe('new');
      expect(PROSPECT_STATUS.CONTACTED).toBe('contacted');
      expect(PROSPECT_STATUS.INTERESTED).toBe('interested');
      expect(PROSPECT_STATUS.UNQUALIFIED).toBe('unqualified');
      expect(PROSPECT_STATUS.REPLIED).toBe('replied');
    });

    it('should export outreach status constants', () => {
      expect(OUTREACH_STATUS).toBeDefined();
      expect(OUTREACH_STATUS.PENDING).toBe('pending');
      expect(OUTREACH_STATUS.QUEUED).toBe('queued');
      expect(OUTREACH_STATUS.SENT).toBe('sent');
      expect(OUTREACH_STATUS.REPLIED).toBe('replied');
      expect(OUTREACH_STATUS.FAILED).toBe('failed');
      expect(OUTREACH_STATUS.UNSUBSCRIBED).toBe('unsubscribed');
    });

    it('should export email event types', () => {
      expect(EMAIL_EVENTS).toBeDefined();
      expect(EMAIL_EVENTS.OPENED).toBe('opened');
      expect(EMAIL_EVENTS.CLICKED).toBe('clicked');
      expect(EMAIL_EVENTS.BOUNCED).toBe('bounced');
      expect(EMAIL_EVENTS.UNSUBSCRIBED).toBe('unsubscribed');
      expect(EMAIL_EVENTS.COMPLAINED).toBe('complained');
    });

    it('should export company size definitions', () => {
      expect(COMPANY_SIZES).toBeDefined();
      expect(COMPANY_SIZES.STARTUP).toBe('1-10');
      expect(COMPANY_SIZES.SMALL).toBe('11-50');
      expect(COMPANY_SIZES.MEDIUM).toBe('51-200');
      expect(COMPANY_SIZES.LARGE).toBe('201-1000');
      expect(COMPANY_SIZES.ENTERPRISE).toBe('1000+');
    });
  });

  describe('Migration SQL', () => {
    it('should have prospects table definition', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE prospects');
      expect(sql).toContain('id UUID PRIMARY KEY');
      expect(sql).toContain('org_id UUID NOT NULL REFERENCES organizations(id)');
      expect(sql).toContain('email VARCHAR(255) NOT NULL');
      expect(sql).toContain('company VARCHAR(255)');
      expect(sql).toContain('icp_score NUMERIC(3,2)');
      expect(sql).toContain('status VARCHAR(50) DEFAULT \'new\'');
      expect(sql).toContain('UNIQUE(org_id, email) WHERE deleted_at IS NULL');
    });

    it('should have outreach_queue table with partitioning', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE outreach_queue');
      expect(sql).toContain('PARTITION BY RANGE (created_at)');
      expect(sql).toContain('prospect_id UUID NOT NULL REFERENCES prospects(id)');
      expect(sql).toContain('status VARCHAR(50) DEFAULT \'pending\'');
      expect(sql).toContain('sent_at TIMESTAMP WITH TIME ZONE');
      expect(sql).toContain('opened_at TIMESTAMP WITH TIME ZONE');
      expect(sql).toContain('replied_at TIMESTAMP WITH TIME ZONE');
    });

    it('should have month-based partitions for outreach_queue', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('outreach_queue_2026_04');
      expect(sql).toContain('outreach_queue_2026_05');
      expect(sql).toContain('outreach_queue_2027_03');
      expect(sql).toContain('FOR VALUES FROM (\'2026-04-01\') TO (\'2026-05-01\')');
    });

    it('should have email_events table definition', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE email_events');
      expect(sql).toContain('outreach_id UUID NOT NULL REFERENCES outreach_queue(id)');
      expect(sql).toContain('event_type VARCHAR(50) NOT NULL');
      expect(sql).toContain('timestamp TIMESTAMP WITH TIME ZONE');
    });

    it('should have indexes on prospects table', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE INDEX idx_prospects_org_status');
      expect(sql).toContain('CREATE INDEX idx_prospects_email');
      expect(sql).toContain('CREATE INDEX idx_prospects_icp_score');
      expect(sql).toContain('CREATE INDEX idx_prospects_fts');
    });

    it('should have indexes on outreach_queue table', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE INDEX idx_outreach_org_status');
      expect(sql).toContain('CREATE INDEX idx_outreach_prospect');
      expect(sql).toContain('CREATE INDEX idx_outreach_sent');
    });

    it('should have indexes on email_events table', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE INDEX idx_email_events_outreach');
      expect(sql).toContain('CREATE INDEX idx_email_events_created');
    });

    it('should have auto-update timestamp triggers for new tables', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TRIGGER update_prospects_updated_at');
      expect(sql).toContain('CREATE TRIGGER update_outreach_queue_updated_at');
    });

    it('should enable RLS on prospects table', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('ALTER TABLE prospects ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('CREATE POLICY prospects_read ON prospects');
    });

    it('should enable RLS on outreach_queue table', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('ALTER TABLE outreach_queue ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('CREATE POLICY outreach_queue_read ON outreach_queue');
    });

    it('should enable RLS on email_events table', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('ALTER TABLE email_events ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('CREATE POLICY email_events_read ON email_events');
    });

    it('should have ICP score constraint', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CHECK (icp_score >= 0 AND icp_score <= 1.0)');
    });

    it('should support full-text search on prospects', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('to_tsvector(\'english\'');
      expect(sql).toContain('CREATE INDEX idx_prospects_fts');
    });
  });
});
