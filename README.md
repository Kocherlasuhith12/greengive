# GreenGive — Golf Charity Subscription Platform
## Complete Setup Guide

---

### STEP 1 — Install dependencies

```bash
npm install
```

---

### STEP 2 — Create a NEW Supabase project

1. Go to https://supabase.com → sign in with a NEW account (not personal)
2. Create New Project → note your:
   - **Project URL** (looks like https://xxxx.supabase.co)
   - **Anon public key** (under Settings → API)
   - **Service role key** (under Settings → API → keep secret)

---

### STEP 3 — Run database schema

In **Supabase → SQL Editor**, run these files IN ORDER:

1. `supabase_schema.sql` — creates all 9 tables, triggers, RLS, seed charities
2. `supabase_patches.sql` — fixes duplicates, adds helper functions, extra policies

---

### STEP 4 — Environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### STEP 5 — Create test users

**In Supabase → Authentication → Users → Add user** (confirm email disabled):

| Email | Password | Role |
|---|---|---|
| user@test.com | test123456 | subscriber |
| admin@test.com | admin123456 | admin |

Then run in SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@test.com';
```

---

### STEP 6 — Run locally

```bash
npm run dev
```

Open http://localhost:3000

---

### STEP 7 — Deploy to Vercel (NEW account)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → sign up with a NEW account
3. Import the GitHub repo
4. Add environment variables (same as .env.local) in Vercel dashboard
5. Deploy

---

### Full test checklist (PRD requirements)

**User flow:**
- [ ] Homepage loads — emotion-first design, no golf clichés
- [ ] Sign up (2 steps: account → plan + charity selection)
- [ ] Login / logout works
- [ ] Dashboard shows subscription status, scores, charity, latest draw
- [ ] Add scores (1–45 Stableford) — try adding 6, confirm oldest auto-removed
- [ ] Scores display newest first
- [ ] Change charity selection and contribution % (min 10%)
- [ ] Draws page shows current draw numbers and history
- [ ] Winnings page shows wins, allows proof URL submission

**Admin flow (login as admin@test.com):**
- [ ] Admin sections visible in sidebar
- [ ] Admin → Users: see all users, edit role/subscription status
- [ ] Admin → Draw Engine: run simulation (see drawn numbers + prize pools)
- [ ] Admin → Draw Engine: publish a draw for current month
- [ ] Admin → Charities: add a new charity, edit, toggle featured/active
- [ ] Admin → Winners: filter, expand, approve/reject, mark paid
- [ ] Admin → Analytics: total users, revenue, charity contributions

**Data accuracy:**
- [ ] Prize pool = 40% of all active subscription fees
- [ ] 5-match = 40%, 4-match = 35%, 3-match = 25% of pool
- [ ] Jackpot rolls over if no 5-match winner
- [ ] Charity % calculated correctly (e.g. 10% of £9.99 = £1.00)

---

### Project structure

```
src/
├── app/
│   ├── page.tsx                         ← Homepage
│   ├── not-found.tsx                    ← 404 page
│   ├── global-error.tsx                 ← Error boundary
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── scores/page.tsx
│   │   ├── charity/page.tsx
│   │   ├── draws/page.tsx
│   │   └── winnings/page.tsx            ← Proof upload + payout tracking
│   ├── admin/
│   │   ├── users/page.tsx               ← Full user management
│   │   ├── draws/page.tsx               ← Draw engine UI
│   │   ├── charities/page.tsx           ← Full CRUD
│   │   ├── winners/page.tsx             ← Verify + pay
│   │   └── stats/page.tsx               ← Analytics
│   └── api/
│       ├── auth/logout/route.ts
│       ├── draws/simulate/route.ts
│       ├── draws/publish/route.ts
│       ├── draws/list/route.ts
│       ├── subscriptions/route.ts
│       ├── donations/route.ts
│       ├── winners/my/route.ts
│       ├── winners/proof/route.ts
│       ├── winners/list/route.ts
│       ├── winners/[id]/route.ts
│       ├── admin/users/route.ts
│       ├── admin/users/[id]/route.ts
│       ├── admin/charities/route.ts
│       └── admin/charities/[id]/route.ts
├── components/layout/Sidebar.tsx
├── lib/
│   ├── drawEngine.ts                    ← Core draw logic
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   └── utils.ts
├── middleware.ts                        ← Auth + route protection
└── types/index.ts
```

---

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Payments | Mock (Stripe-ready) |
| Deploy | Vercel |
