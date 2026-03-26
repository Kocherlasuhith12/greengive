'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Heart, CheckCircle, X, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Charity {
  id: string
  name: string
  description: string | null
  website_url: string | null
  image_url: string | null
  is_featured: boolean
  is_active: boolean
  total_raised: number
  created_at: string
}

const emptyForm = { name: '', description: '', website_url: '', image_url: '', is_featured: false }

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Charity | null>(null)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  const fetchCharities = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/charities')
    const data = await res.json()
    if (data.charities) setCharities(data.charities)
    setLoading(false)
  }, [])

  useEffect(() => { fetchCharities() }, [fetchCharities])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  function openEdit(c: Charity) {
    setEditing(c)
    setForm({
      name: c.name,
      description: c.description || '',
      website_url: c.website_url || '',
      image_url: c.image_url || '',
      is_featured: c.is_featured,
    })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Charity name is required'); return }
    setSaving(true)
    setError('')

    const url    = editing ? `/api/admin/charities/${editing.id}` : '/api/admin/charities'
    const method = editing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Save failed'); setSaving(false); return }

    setShowModal(false)
    setSuccess(editing ? 'Charity updated' : 'Charity added')
    setTimeout(() => setSuccess(''), 3000)
    fetchCharities()
    setSaving(false)
  }

  async function toggleActive(c: Charity) {
    await fetch(`/api/admin/charities/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    })
    fetchCharities()
  }

  async function toggleFeatured(c: Charity) {
    await fetch(`/api/admin/charities/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !c.is_featured }),
    })
    fetchCharities()
  }

  async function handleDelete(c: Charity) {
    if (!confirm(`Deactivate "${c.name}"? This removes it from user selection.`)) return
    await fetch(`/api/admin/charities/${c.id}`, { method: 'DELETE' })
    fetchCharities()
  }

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Charities</h1>
          <p className="text-gray-400 text-sm mt-1">{charities.filter(c => c.is_active).length} active charities</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add charity
        </button>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 rounded-xl bg-brand-900/30 border border-brand-700 text-brand-300 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charities grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-dark-700 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {charities.map(c => (
            <div key={c.id} className={`card p-5 ${!c.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-900/30 flex items-center justify-center shrink-0">
                    <Heart size={18} className="text-pink-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{c.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {c.is_featured && (
                        <span className="badge-gold text-xs flex items-center gap-0.5">
                          <Star size={10} /> Featured
                        </span>
                      )}
                      <span className={`badge text-xs ${c.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-dark-600 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(c)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {c.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-dark-600">
                <span className="text-xs text-pink-400/70">
                  {formatCurrency(c.total_raised)} raised
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFeatured(c)}
                    className="text-xs text-gray-500 hover:text-gold-400 transition-colors">
                    {c.is_featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <span className="text-gray-700">·</span>
                  <button onClick={() => toggleActive(c)}
                    className={`text-xs transition-colors ${c.is_active ? 'text-gray-500 hover:text-red-400' : 'text-gray-500 hover:text-brand-400'}`}>
                    {c.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.7)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-800 border border-dark-500 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">
                  {editing ? 'Edit charity' : 'Add charity'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Charity name *</label>
                  <input className="input" placeholder="e.g. Macmillan Cancer Support" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="input resize-none" rows={3} placeholder="Short description of the charity"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Website URL</label>
                  <input className="input" placeholder="https://example.org" value={form.website_url}
                    onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Image URL</label>
                  <input className="input" placeholder="https://... (optional)" value={form.image_url}
                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-brand-500 rounded"
                    checked={form.is_featured}
                    onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                  <span className="text-sm text-gray-300">Feature on homepage</span>
                </label>

                {error && (
                  <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/50 p-3 rounded-xl">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                    {saving ? 'Saving…' : editing ? 'Save changes' : 'Add charity'}
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
