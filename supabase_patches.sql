-- ============================================================
-- supabase_patches.sql
-- Run this AFTER supabase_schema.sql if you already ran it
-- OR add it to the bottom of supabase_schema.sql before running
-- ============================================================

-- Fix duplicate charity seeds (safe to run multiple times)
DELETE FROM charities
WHERE id NOT IN (
  SELECT MIN(id) FROM charities GROUP BY name
);

-- Ensure unique charity names going forward
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'charities_name_unique'
  ) THEN
    ALTER TABLE charities ADD CONSTRAINT charities_name_unique UNIQUE (name);
  END IF;
END $$;

-- ── Function: increment charity total_raised ─────────────────
CREATE OR REPLACE FUNCTION increment_charity_raised(
  charity_id_input UUID,
  amount_input INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE charities
  SET total_raised = total_raised + amount_input,
      updated_at = NOW()
  WHERE id = charity_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS for charity_donations ────────────────────────────────
CREATE POLICY "Users can insert own donations" ON charity_donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own donations" ON charity_donations
  FOR SELECT USING (auth.uid() = user_id);

-- ── Admin can bypass RLS for all tables (via service role) ───
-- Note: service_role key automatically bypasses RLS.
-- No extra policies needed for admin API routes using createAdminClient().

-- ── Ensure profiles policy doesn't block admin reads ────────
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  );

-- ── Public draw entries visible after publish ────────────────
DROP POLICY IF EXISTS "Users can view own draw entries" ON draw_entries;
CREATE POLICY "Users can view own draw entries" ON draw_entries
  FOR SELECT USING (auth.uid() = user_id);

-- ── Draws: admins can read all ───────────────────────────────
CREATE POLICY "Admins can view all draws" ON draws
  FOR SELECT USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
