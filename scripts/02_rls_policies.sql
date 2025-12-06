-- ============================================================
-- Enable RLS on leads table
-- ============================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Adding DROP POLICY IF EXISTS to handle re-runs
-- ============================================================
-- RLS Policy: SELECT - Counselors see their leads + team leads
-- ============================================================
DROP POLICY IF EXISTS "counselors_select_own_and_team_leads" ON leads;
CREATE POLICY "counselors_select_own_and_team_leads"
  ON leads
  FOR SELECT
  USING (
    -- Admins can see all leads
    auth.jwt() ->> 'role' = 'admin'
    OR
    -- Counselors can see leads assigned to them
    owner_id = auth.uid()
    OR
    -- Counselors can see leads assigned to their team members
    owner_id IN (
      SELECT user_id FROM user_teams
      WHERE team_id IN (
        SELECT team_id FROM user_teams
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- RLS Policy: INSERT - Only team members can create leads
-- ============================================================
DROP POLICY IF EXISTS "counselors_insert_leads" ON leads;
CREATE POLICY "counselors_insert_leads"
  ON leads
  FOR INSERT
  WITH CHECK (
    -- Admins can insert leads
    auth.jwt() ->> 'role' = 'admin'
    OR
    -- Counselors can only insert leads assigned to themselves or their team
    owner_id = auth.uid()
    OR
    owner_id IN (
      SELECT user_id FROM user_teams
      WHERE team_id IN (
        SELECT team_id FROM user_teams
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- RLS Policy: UPDATE - Only admins or lead owner can update
-- ============================================================
DROP POLICY IF EXISTS "update_own_leads" ON leads;
CREATE POLICY "update_own_leads"
  ON leads
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR
    owner_id = auth.uid()
  );

-- ============================================================
-- Enable RLS on applications table
-- ============================================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policy: SELECT applications - Through lead access
-- ============================================================
DROP POLICY IF EXISTS "view_applications_through_leads" ON applications;
CREATE POLICY "view_applications_through_leads"
  ON applications
  FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads
      WHERE auth.jwt() ->> 'role' = 'admin'
        OR owner_id = auth.uid()
        OR owner_id IN (
          SELECT user_id FROM user_teams
          WHERE team_id IN (
            SELECT team_id FROM user_teams
            WHERE user_id = auth.uid()
          )
        )
    )
  );

-- ============================================================
-- Enable RLS on tasks table
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policy: SELECT tasks - Through application/lead access
-- ============================================================
DROP POLICY IF EXISTS "view_tasks_through_applications" ON tasks;
CREATE POLICY "view_tasks_through_applications"
  ON tasks
  FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications
      WHERE lead_id IN (
        SELECT id FROM leads
        WHERE auth.jwt() ->> 'role' = 'admin'
          OR owner_id = auth.uid()
          OR owner_id IN (
            SELECT user_id FROM user_teams
            WHERE team_id IN (
              SELECT team_id FROM user_teams
              WHERE user_id = auth.uid()
            )
          )
      )
    )
  );

-- ============================================================
-- RLS Policy: INSERT/UPDATE tasks
-- ============================================================
DROP POLICY IF EXISTS "manage_tasks_through_applications" ON tasks;
CREATE POLICY "manage_tasks_through_applications"
  ON tasks
  FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT id FROM applications
      WHERE lead_id IN (
        SELECT id FROM leads
        WHERE auth.jwt() ->> 'role' = 'admin'
          OR owner_id = auth.uid()
          OR owner_id IN (
            SELECT user_id FROM user_teams
            WHERE team_id IN (
              SELECT team_id FROM user_teams
              WHERE user_id = auth.uid()
            )
          )
      )
    )
  );

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks"
  ON tasks
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR
    application_id IN (
      SELECT id FROM applications
      WHERE lead_id IN (
        SELECT id FROM leads
        WHERE owner_id = auth.uid()
          OR owner_id IN (
            SELECT user_id FROM user_teams
            WHERE team_id IN (
              SELECT team_id FROM user_teams
              WHERE user_id = auth.uid()
            )
          )
      )
    )
  );
