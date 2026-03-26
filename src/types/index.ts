// ============================================================
// Platform-wide TypeScript types
// ============================================================

export type UserRole = 'subscriber' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export type SubscriptionPlan = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'cancelled' | 'lapsed' | 'pending'

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  amount_pence: number
  charity_id: string | null
  charity_percentage: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface Score {
  id: string
  user_id: string
  score: number
  played_at: string
  created_at: string
}

export interface Charity {
  id: string
  name: string
  description: string | null
  image_url: string | null
  website_url: string | null
  is_featured: boolean
  is_active: boolean
  total_raised: number
  created_at: string
  updated_at: string
}

export interface CharityEvent {
  id: string
  charity_id: string
  title: string
  description: string | null
  event_date: string
  location: string | null
  created_at: string
}

export type DrawStatus = 'pending' | 'simulated' | 'published'
export type DrawType = 'random' | 'algorithmic'

export interface Draw {
  id: string
  draw_month: string
  status: DrawStatus
  draw_type: DrawType
  drawn_numbers: number[]
  total_pool_pence: number
  pool_5_match: number
  pool_4_match: number
  pool_3_match: number
  jackpot_rollover: number
  active_subscribers: number
  created_by: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  entry_numbers: number[]
  match_count: number
  is_winner: boolean
  created_at: string
}

export type MatchType = '3_match' | '4_match' | '5_match'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type PaymentStatus = 'pending' | 'paid'

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  draw_entry_id: string | null
  match_type: MatchType
  prize_amount_pence: number
  verification_status: VerificationStatus
  proof_url: string | null
  payment_status: PaymentStatus
  admin_notes: string | null
  submitted_at: string | null
  verified_at: string | null
  paid_at: string | null
  created_at: string
}

// Subscription pricing constants
export const PLANS = {
  monthly: { amount_pence: 999,  label: '£9.99/month', period: 'month' },
  yearly:  { amount_pence: 8999, label: '£89.99/year', period: 'year', saving: 'Save 25%' },
} as const
