-- ============================================================
-- Seed test users — run AFTER schema SQL
-- ============================================================

-- Step 1: Create users via Supabase Dashboard
--   Authentication > Users > Add user (confirm email = true)
--   user@test.com   / test123456
--   admin@test.com  / admin123456

-- Step 2: Run this to promote admin
UPDATE profiles SET role = 'admin' WHERE email = 'admin@test.com';

-- Step 3: Seed a published draw for demo
INSERT INTO draws (
  draw_month, status, draw_type, drawn_numbers,
  total_pool_pence, pool_5_match, pool_4_match, pool_3_match,
  active_subscribers, published_at
) VALUES (
  '2026-02', 'published', 'random', ARRAY[18, 24, 31, 36, 42],
  50000, 20000, 17500, 12500, 50, NOW()
) ON CONFLICT (draw_month) DO NOTHING;
