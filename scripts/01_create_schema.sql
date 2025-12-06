-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: tenants (create FIRST - no dependencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE: teams (depends on tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_teams_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teams_tenant_id 
  ON teams(tenant_id);

-- ============================================================
-- TABLE: user_teams (depends on teams)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  team_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_user_teams_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(user_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_user_teams_user_id 
  ON user_teams(user_id);

CREATE INDEX IF NOT EXISTS idx_user_teams_team_id 
  ON user_teams(team_id);

-- ============================================================
-- TABLE: leads (depends on tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  stage TEXT NOT NULL DEFAULT 'new',
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Reordered indexes to follow table definition
CREATE INDEX IF NOT EXISTS idx_leads_owner_id 
  ON leads(owner_id);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_id 
  ON leads(tenant_id);

CREATE INDEX IF NOT EXISTS idx_leads_stage 
  ON leads(stage);

CREATE INDEX IF NOT EXISTS idx_leads_created_at 
  ON leads(created_at);

CREATE INDEX IF NOT EXISTS idx_leads_owner_stage_created 
  ON leads(owner_id, stage, created_at);

-- ============================================================
-- TABLE: applications (depends on leads and tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_applications_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Reordered indexes to follow table definition
CREATE INDEX IF NOT EXISTS idx_applications_lead_id 
  ON applications(lead_id);

CREATE INDEX IF NOT EXISTS idx_applications_tenant_id 
  ON applications(tenant_id);

CREATE INDEX IF NOT EXISTS idx_applications_status 
  ON applications(status);

CREATE INDEX IF NOT EXISTS idx_applications_tenant_lead 
  ON applications(tenant_id, lead_id);

-- ============================================================
-- TABLE: tasks (depends on applications and tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  application_id UUID NOT NULL,
  related_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_tasks_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Check constraints
  CONSTRAINT check_task_type CHECK (type IN ('call', 'email', 'review')),
  CONSTRAINT check_due_at_future CHECK (due_at >= created_at)
);

-- Reordered indexes to follow table definition
CREATE INDEX IF NOT EXISTS idx_tasks_application_id 
  ON tasks(application_id);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id 
  ON tasks(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tasks_due_at 
  ON tasks(due_at);

CREATE INDEX IF NOT EXISTS idx_tasks_type 
  ON tasks(type);

CREATE INDEX IF NOT EXISTS idx_tasks_status 
  ON tasks(status);

-- Removed problematic index with non-immutable CURRENT_DATE function
-- PostgreSQL requires index predicates to use only immutable functions.
-- The idx_tasks_tenant_due_status index below is sufficient for querying tasks by due date.

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_due_status 
  ON tasks(tenant_id, due_at, status);
