-- ============================================================
-- Golf Charity Platform — Supabase SQL Schema v3
-- Safe, rerunnable, and signup-friendly
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT DEFAULT '',
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional helpful index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================
-- 2. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan                    TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'lapsed', 'pending')),
  amount_pence            INTEGER NOT NULL CHECK (amount_pence >= 0),
  charity_id              UUID,
  charity_percentage      INTEGER NOT NULL DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  current_period_start    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_charity_id ON public.subscriptions(charity_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ============================================================
-- 3. SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_at   DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_user_played ON public.scores(user_id, played_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_score_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  score_count     INTEGER;
  oldest_score_id UUID;
BEGIN
  SELECT COUNT(*)
  INTO score_count
  FROM public.scores
  WHERE user_id = NEW.user_id;

  IF score_count >= 5 THEN
    SELECT id
    INTO oldest_score_id
    FROM public.scores
    WHERE user_id = NEW.user_id
    ORDER BY played_at ASC, created_at ASC
    LIMIT 1;

    IF oldest_score_id IS NOT NULL THEN
      DELETE FROM public.scores
      WHERE id = oldest_score_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_score_limit ON public.scores;
CREATE TRIGGER trg_enforce_score_limit
  BEFORE INSERT ON public.scores
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_score_limit();

-- ============================================================
-- 4. CHARITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.charities (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL UNIQUE,
  description  TEXT,
  image_url    TEXT,
  website_url  TEXT,
  is_featured  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  total_raised INTEGER NOT NULL DEFAULT 0 CHECK (total_raised >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charities_active_featured ON public.charities(is_active, is_featured);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_subscriptions_charity'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT fk_subscriptions_charity
      FOREIGN KEY (charity_id)
      REFERENCES public.charities(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 5. CHARITY EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.charity_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  charity_id  UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  location    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charity_events_charity_date ON public.charity_events(charity_id, event_date DESC);

-- ============================================================
-- 6. DRAWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.draws (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_month          TEXT NOT NULL UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  draw_type           TEXT NOT NULL DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  drawn_numbers       INTEGER[] NOT NULL DEFAULT '{}',
  total_pool_pence    INTEGER NOT NULL DEFAULT 0 CHECK (total_pool_pence >= 0),
  pool_5_match        INTEGER NOT NULL DEFAULT 0 CHECK (pool_5_match >= 0),
  pool_4_match        INTEGER NOT NULL DEFAULT 0 CHECK (pool_4_match >= 0),
  pool_3_match        INTEGER NOT NULL DEFAULT 0 CHECK (pool_3_match >= 0),
  jackpot_rollover    INTEGER NOT NULL DEFAULT 0 CHECK (jackpot_rollover >= 0),
  active_subscribers  INTEGER NOT NULL DEFAULT 0 CHECK (active_subscribers >= 0),
  created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_draws_status_created_at ON public.draws(status, created_at DESC);

-- ============================================================
-- 7. DRAW ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.draw_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id         UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_numbers   INTEGER[] NOT NULL,
  match_count     INTEGER NOT NULL DEFAULT 0 CHECK (match_count >= 0),
  is_winner       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_draw_user UNIQUE(draw_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_draw_entries_user_id ON public.draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw_id ON public.draw_entries(draw_id);

-- ============================================================
-- 8. WINNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.winners (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id               UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  draw_entry_id         UUID REFERENCES public.draw_entries(id) ON DELETE SET NULL,
  match_type            TEXT NOT NULL CHECK (match_type IN ('3_match', '4_match', '5_match')),
  prize_amount_pence    INTEGER NOT NULL CHECK (prize_amount_pence >= 0),
  verification_status   TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  proof_url             TEXT,
  payment_status        TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  admin_notes           TEXT,
  submitted_at          TIMESTAMPTZ,
  verified_at           TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_winners_user_id ON public.winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON public.winners(draw_id);

-- ============================================================
-- 9. CHARITY DONATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.charity_donations (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id                    UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  amount_pence                  INTEGER NOT NULL CHECK (amount_pence >= 0),
  is_subscription_contribution  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charity_donations_user_id ON public.charity_donations(user_id);
CREATE INDEX IF NOT EXISTS idx_charity_donations_charity_id ON public.charity_donations(charity_id);

-- ============================================================
-- 10. UPDATED_AT HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_charities_updated_at ON public.charities;
CREATE TRIGGER trg_charities_updated_at
  BEFORE UPDATE ON public.charities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_draws_updated_at ON public.draws;
CREATE TRIGGER trg_draws_updated_at
  BEFORE UPDATE ON public.draws
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 11. NEW USER HANDLER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'subscriber'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 12. CHARITY TOTAL HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_charity_raised(
  charity_id_input UUID,
  amount_input INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.charities
  SET
    total_raised = total_raised + amount_input,
    updated_at = NOW()
  WHERE id = charity_id_input;
END;
$$;

-- ============================================================
-- 13. ENABLE RLS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_donations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 14. DROP POLICIES FOR SAFE RERUN
-- ============================================================
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;

DROP POLICY IF EXISTS "subs_own_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subs_own_insert" ON public.subscriptions;
DROP POLICY IF EXISTS "subs_own_update" ON public.subscriptions;

DROP POLICY IF EXISTS "scores_own_select" ON public.scores;
DROP POLICY IF EXISTS "scores_own_insert" ON public.scores;
DROP POLICY IF EXISTS "scores_own_update" ON public.scores;
DROP POLICY IF EXISTS "scores_own_delete" ON public.scores;

DROP POLICY IF EXISTS "charities_public_read" ON public.charities;
DROP POLICY IF EXISTS "charity_events_public" ON public.charity_events;

DROP POLICY IF EXISTS "draws_published_read" ON public.draws;

DROP POLICY IF EXISTS "entries_own_select" ON public.draw_entries;
DROP POLICY IF EXISTS "entries_own_insert" ON public.draw_entries;

DROP POLICY IF EXISTS "winners_own_select" ON public.winners;
DROP POLICY IF EXISTS "winners_own_update" ON public.winners;

DROP POLICY IF EXISTS "donations_own_insert" ON public.charity_donations;
DROP POLICY IF EXISTS "donations_own_select" ON public.charity_donations;

-- ============================================================
-- 15. POLICIES
-- ============================================================

-- Profiles
CREATE POLICY "profiles_self_select"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

CREATE POLICY "profiles_self_update"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_self_insert"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Subscriptions
CREATE POLICY "subs_own_select"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "subs_own_insert"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subs_own_update"
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Scores
CREATE POLICY "scores_own_select"
ON public.scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "scores_own_insert"
ON public.scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scores_own_update"
ON public.scores
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scores_own_delete"
ON public.scores
FOR DELETE
USING (auth.uid() = user_id);

-- Charities
CREATE POLICY "charities_public_read"
ON public.charities
FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "charity_events_public"
ON public.charity_events
FOR SELECT
USING (TRUE);

-- Draws
CREATE POLICY "draws_published_read"
ON public.draws
FOR SELECT
USING (
  status = 'published'
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- Draw entries
CREATE POLICY "entries_own_select"
ON public.draw_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "entries_own_insert"
ON public.draw_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Winners
CREATE POLICY "winners_own_select"
ON public.winners
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "winners_own_update"
ON public.winners
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Donations
CREATE POLICY "donations_own_insert"
ON public.charity_donations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "donations_own_select"
ON public.charity_donations
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================
-- 16. SEED CHARITIES
-- ============================================================
INSERT INTO public.charities (
  name,
  description,
  website_url,
  is_featured,
  is_active
)
VALUES
  (
    'Golf Foundation',
    'Growing golf participation for young people across the UK since 1952.',
    'https://www.golf-foundation.org',
    TRUE,
    TRUE
  ),
  (
    'Macmillan Cancer Support',
    'Supporting people living with cancer every step of the way.',
    'https://www.macmillan.org.uk',
    FALSE,
    TRUE
  ),
  (
    'Age UK',
    'Providing essential support and services to older people in need.',
    'https://www.ageuk.org.uk',
    FALSE,
    TRUE
  ),
  (
    'RNLI',
    'Saving lives at sea — the Royal National Lifeboat Institution.',
    'https://rnli.org',
    FALSE,
    TRUE
  ),
  (
    'British Heart Foundation',
    'Fighting heart and circulatory diseases through research and care.',
    'https://www.bhf.org.uk',
    FALSE,
    TRUE
  )
ON CONFLICT (name) DO NOTHING;