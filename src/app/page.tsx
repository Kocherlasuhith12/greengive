'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Heart, Trophy, BarChart3, CheckCircle } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } },
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-dark-900 overflow-hidden">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-dark-700/50 backdrop-blur-md bg-dark-900/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold gradient-text">
            GreenGive
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/signup" className="btn-primary text-sm px-4 py-2">
              Join now
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-28 pb-24 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-gold-500/5 rounded-full blur-[80px]" />
        </div>

        <motion.div
          className="max-w-4xl mx-auto text-center relative"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-700 text-brand-400 text-sm mb-8">
              <Heart size={14} className="fill-brand-500 text-brand-500" />
              Every swing supports a cause
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Play golf.{' '}
            <span className="gradient-text">Give back.</span>
            <br />Win every month.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            GreenGive turns your Stableford scores into monthly prize draws — while a portion
            of every subscription goes directly to the charity you choose.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary text-base px-8 py-4 group">
              Start for £9.99/month
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary text-base px-8 py-4">
              See how it works
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-4 text-sm text-gray-600">
            Cancel anytime · Save 25% with yearly
          </motion.p>
        </motion.div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-dark-600 py-8 px-4 bg-dark-800/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '£1,200+', label: 'In prize pools' },
            { value: '5', label: 'Charities supported' },
            { value: 'Monthly', label: 'Draw cadence' },
            { value: '10%+', label: 'Goes to charity' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl font-display font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">How GreenGive works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Three simple steps. One powerful impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 size={28} className="text-brand-400" />,
                step: '01',
                title: 'Enter your scores',
                desc: "Log your latest Stableford score after each round. We keep your 5 most recent — those become your draw numbers.",
              },
              {
                icon: <Trophy size={28} className="text-gold-400" />,
                step: '02',
                title: 'Monthly prize draw',
                desc: "Each month we draw 5 numbers. Match 3, 4, or all 5 of your scores and you win from the prize pool.",
              },
              {
                icon: <Heart size={28} className="text-pink-400" />,
                step: '03',
                title: 'Give as you play',
                desc: "A portion of your subscription — at least 10% — automatically goes to the charity you chose at signup.",
              },
            ].map(item => (
              <motion.div
                key={item.step}
                className="card-hover p-8 relative overflow-hidden"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute top-4 right-4 text-6xl font-display font-bold text-dark-600 leading-none select-none">
                  {item.step}
                </div>
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIZES SECTION */}
      <section className="py-24 px-4 bg-dark-800/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">
              Three ways to <span className="gradient-text">win</span>
            </h2>
            <p className="text-gray-400">Match your scores to the monthly draw numbers.</p>
          </div>

          <div className="space-y-4">
            {[
              { match: '5-Number Match', share: '40%', label: 'Jackpot', color: 'text-gold-400', border: 'border-gold-600/30', bg: 'bg-gold-900/10', rollover: true },
              { match: '4-Number Match', share: '35%', label: 'Major Prize', color: 'text-brand-400', border: 'border-brand-600/30', bg: 'bg-brand-900/10', rollover: false },
              { match: '3-Number Match', share: '25%', label: 'Standard Prize', color: 'text-blue-400', border: 'border-blue-600/30', bg: 'bg-blue-900/10', rollover: false },
            ].map(tier => (
              <motion.div
                key={tier.match}
                className={`flex items-center justify-between p-6 rounded-2xl border ${tier.border} ${tier.bg}`}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <div className={`text-lg font-semibold ${tier.color}`}>{tier.match}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{tier.label}{tier.rollover ? ' · Jackpot rolls over if unclaimed' : ''}</div>
                </div>
                <div className={`text-3xl font-display font-bold ${tier.color}`}>{tier.share}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CHARITIES SECTION */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Heart size={40} className="text-pink-500 mx-auto mb-6 fill-pink-500/20" />
          <h2 className="section-title mb-4">You choose who benefits</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-12">
            Select a charity that matters to you at signup. A minimum of 10% of your subscription
            goes directly to them — and you can give more if you want.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {['Golf Foundation', 'Macmillan Cancer Support', 'Age UK', 'RNLI', 'British Heart Foundation'].map(name => (
              <span key={name} className="px-4 py-2 rounded-full border border-dark-500 text-gray-300 text-sm hover:border-brand-600 hover:text-brand-300 transition-colors cursor-default">
                {name}
              </span>
            ))}
          </div>
          <Link href="/signup" className="btn-secondary inline-flex">
            View all charities
          </Link>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 px-4 bg-dark-800/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Simple, transparent pricing</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly */}
            <div className="card p-8">
              <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Monthly</div>
              <div className="text-4xl font-display font-bold text-white mb-1">£9.99</div>
              <div className="text-gray-500 text-sm mb-6">per month · cancel anytime</div>
              <ul className="space-y-3 mb-8">
                {['Monthly prize draw entry', 'Score tracking (5 scores)', 'Charity contribution (10%+)', 'Full dashboard access'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle size={16} className="text-brand-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=monthly" className="btn-secondary w-full justify-center">
                Choose monthly
              </Link>
            </div>

            {/* Yearly */}
            <div className="card p-8 border-brand-600/50 relative overflow-hidden">
              <div className="absolute top-4 right-4 badge-gold">Save 25%</div>
              <div className="text-brand-400 text-sm uppercase tracking-wider mb-2">Yearly</div>
              <div className="text-4xl font-display font-bold text-white mb-1">£89.99</div>
              <div className="text-gray-500 text-sm mb-6">per year · 2 months free</div>
              <ul className="space-y-3 mb-8">
                {['Everything in Monthly', 'Best value — save £29.89', 'Priority draw entry', 'Early access to new features'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle size={16} className="text-brand-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=yearly" className="btn-primary w-full justify-center">
                Choose yearly
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-dark-600 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display text-xl font-bold gradient-text">GreenGive</div>
          <p className="text-gray-600 text-sm">© 2026 GreenGive. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
