'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Pencil, X, CheckCircle, Search } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  subscriptions?: {
    id: string
    plan: string
    status: string
    amount_pence: number
    current_period_end: string | null
  }[]
}

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<UserRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [editing, setEditing]   = useState<UserRow | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editSubStatus, setEditSubStatus] = useState('')
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    if (data.users) setUsers(data.users)
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function openEdit(u: UserRow) {
    setEditing(u)
    setEditRole(u.role)
    setEditSubStatus(u.subscriptions?.[0]?.status || '')
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    await fetch(`/api/admin/users/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: editRole,
        subscription_status: editSubStatus || undefined,
      }),
    })
    setEditing(null)
    setSuccess('User updated')
    setTimeout(() => setSuccess(''), 3000)
    fetchUsers()
    setSaving(false)
  }

  const filtered = users.filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-1">{users.length} total members</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 w-60 text-sm" placeholder="Search users…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 rounded-xl bg-brand-900/30 border border-brand-700 text-brand-300 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600 bg-dark-700/50">
                {['User', 'Role', 'Plan', 'Status', 'Amount', 'Renews', 'Joined', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-dark-600 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Users size={32} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">{search ? 'No users match your search' : 'No users yet'}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => {
                  const sub = u.subscriptions?.[0]
                  return (
                    <tr key={u.id}
                      className={`border-b border-dark-600 hover:bg-dark-700/30 transition-colors ${i % 2 ? 'bg-dark-800/20' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white truncate max-w-[140px]">{u.full_name || '—'}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[140px]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-inactive'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 capitalize">{sub?.plan || '—'}</td>
                      <td className="px-4 py-3">
                        {sub ? (
                          <span className={`badge ${sub.status === 'active' ? 'badge-active' : sub.status === 'cancelled' ? 'badge-danger' : 'badge-inactive'}`}>
                            {sub.status}
                          </span>
                        ) : <span className="text-gray-600 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {sub ? formatCurrency(sub.amount_pence) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {sub?.current_period_end ? formatDate(sub.current_period_end) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-dark-600 transition-colors">
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.7)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-800 border border-dark-500 rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">Edit user</h2>
                <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <p className="text-sm text-white">{editing.email}</p>
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={editRole} onChange={e => setEditRole(e.target.value)}>
                    <option value="subscriber">Subscriber</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {editing.subscriptions?.[0] && (
                  <div>
                    <label className="label">Subscription status</label>
                    <select className="input" value={editSubStatus} onChange={e => setEditSubStatus(e.target.value)}>
                      <option value="active">Active</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="lapsed">Lapsed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setEditing(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1 justify-center">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
