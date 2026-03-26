'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Target, Heart, Trophy, Award,
  LogOut, Menu, X, ChevronRight, ShieldCheck
} from 'lucide-react'
import { cn, getInitials, formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Subscription } from '@/types'

interface SidebarProps {
  profile: Profile | null
  subscription: Subscription | null
}

const userNav = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/scores',    label: 'My Scores',  icon: Target },
  { href: '/charity',   label: 'My Charity', icon: Heart },
  { href: '/draws',     label: 'Draws',      icon: Trophy },
  { href: '/winnings',  label: 'Winnings',   icon: Award },
]

const adminNav = [
  { href: '/admin/users',     label: 'Users' },
  { href: '/admin/draws',     label: 'Draw Engine' },
  { href: '/admin/charities', label: 'Charities' },
  { href: '/admin/winners',   label: 'Winners' },
  { href: '/admin/stats',     label: 'Analytics' },
]

export default function Sidebar({ profile, subscription }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-dark-600 shrink-0">
        <Link href="/" className="font-display text-xl font-bold gradient-text">GreenGive</Link>
      </div>

      <div className="p-4 mx-3 mt-4 rounded-xl bg-dark-700 border border-dark-500 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {getInitials(profile?.full_name || profile?.email || null)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Member'}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          {subscription ? (
            <>
              <span className="badge-active text-xs capitalize">{subscription.plan}</span>
              <span className="text-xs text-gray-500">
                {formatCurrency(subscription.amount_pence)}/{subscription.plan === 'monthly' ? 'mo' : 'yr'}
              </span>
            </>
          ) : (
            <Link href="/signup" className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
              Subscribe to enter draws <ChevronRight size={12} />
            </Link>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {userNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive(href)
                ? 'bg-brand-900/40 text-brand-300 border border-brand-700/50'
                : 'text-gray-400 hover:text-white hover:bg-dark-700'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}

        {profile?.role === 'admin' && (
          <>
            <div className="pt-5 pb-1 px-4">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-gray-600" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Admin</span>
              </div>
            </div>
            {adminNav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive(href)
                    ? 'bg-brand-900/40 text-brand-300 border border-brand-700/50'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-dark-600 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/10 transition-all duration-150"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-dark-800 border-r border-dark-600 flex-col z-40">
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-4">
        <Link href="/" className="font-display text-lg font-bold gradient-text">GreenGive</Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-400 hover:text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 pt-14">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-72 h-full bg-dark-800 border-r border-dark-600 overflow-y-auto">
              <SidebarContent />
            </aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
