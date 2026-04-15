import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SUBSCRIPTION_TIERS,
  ROLES,
  ROLE_PERMISSIONS
} from '../schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Schema', () => {
  describe('Schema Type Definitions', () => {
    it('should export subscription tiers', () => {
      expect(SUBSCRIPTION_TIERS).toBeDefined();
      expect(SUBSCRIPTION_TIERS.FREE).toBe('free');
      expect(SUBSCRIPTION_TIERS.PRO).toBe('pro');
      expect(SUBSCRIPTION_TIERS.ENTERPRISE).toBe('enterprise');
    });

    it('should export role definitions', () => {
      expect(ROLES).toBeDefined();
      expect(ROLES.OWNER).toBe('owner');
      expect(ROLES.ADMIN).toBe('admin');
      expect(ROLES.LEAD).toBe('lead');
      expect(ROLES.MEMBER).toBe('member');
      expect(ROLES.VIEWER).toBe('viewer');
    });

    it('should have role permissions defined', () => {
      expect(ROLE_PERMISSIONS).toBeDefined();
      expect(ROLE_PERMISSIONS.owner).toContain('*');
      expect(ROLE_PERMISSIONS.admin).toContain('read:*');
      expect(ROLE_PERMISSIONS.member).toContain('read:prospects');
      expect(ROLE_PERMISSIONS.viewer).toContain('read:dashboards');
    });
  });

  describe('Migration SQL', () => {
    it('should have migration file for core schema', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const exists = fs.existsSync(migrationPath);
      expect(exists).toBe(true);
    });

    it('should contain users table definition', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE users');
      expect(sql).toContain('id UUID PRIMARY KEY');
      expect(sql).toContain('email VARCHAR(255) NOT NULL UNIQUE');
      expect(sql).toContain('password_hash VARCHAR(255)');
      expect(sql).toContain('created_at TIMESTAMP WITH TIME ZONE');
    });

    it('should contain organizations table definition', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE organizations');
      expect(sql).toContain('created_by UUID NOT NULL REFERENCES users(id)');
      expect(sql).toContain('subscription_tier VARCHAR(50) DEFAULT \'free\'');
    });

    it('should contain team_members table definition', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE team_members');
      expect(sql).toContain('org_id UUID NOT NULL REFERENCES organizations(id)');
      expect(sql).toContain('user_id UUID NOT NULL REFERENCES users(id)');
      expect(sql).toContain('role VARCHAR(50) NOT NULL DEFAULT \'member\'');
    });

    it('should contain api_keys table definition', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE api_keys');
      expect(sql).toContain('key_hash VARCHAR(255) NOT NULL UNIQUE');
      expect(sql).toContain('scopes JSON DEFAULT \'[]\'');
    });

    it('should have indexes on key columns', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE INDEX idx_users_email');
      expect(sql).toContain('CREATE INDEX idx_organizations_created_by');
      expect(sql).toContain('CREATE INDEX idx_team_members_org_id');
      expect(sql).toContain('CREATE INDEX idx_api_keys_org_id');
    });

    it('should have auto-update timestamp triggers', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION update_updated_at_column()');
      expect(sql).toContain('CREATE TRIGGER update_users_updated_at');
      expect(sql).toContain('CREATE TRIGGER update_organizations_updated_at');
      expect(sql).toContain('CREATE TRIGGER update_team_members_updated_at');
    });

    it('should enable row-level security', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('ALTER TABLE organizations ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('ALTER TABLE team_members ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('CREATE POLICY users_read_self');
      expect(sql).toContain('CREATE POLICY organizations_read');
    });

    it('should enable required PostgreSQL extensions', () => {
      const migrationPath = path.join(__dirname, '../../../migrations/002_core_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    });
  });
});
