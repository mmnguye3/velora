'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Automation {
  id: string
  name: string
  triggerType: string
  triggerValue: string | null
  replyType: string
  replyContent: string
  priority: number
  isActive: boolean
}

export default function AutomationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', triggerType: 'keyword', triggerValue: '', replyType: 'text', replyContent: '', priority: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session) fetchAutomations()
  }, [session])

  const fetchAutomations = async () => {
    const res = await fetch('/api/automations')
    const data = await res.json()
    setAutomations(data)
  }

  const createAutomation = async () => {
    if (!form.name || !form.replyContent) return
    setSaving(true)
    await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ name: '', triggerType: 'keyword', triggerValue: '', replyType: 'text', replyContent: '', priority: 0 })
    setShowForm(false)
    setSaving(false)
    fetchAutomations()
  }

  const toggleAutomation = async (id: string, isActive: boolean) => {
    await fetch(`/api/automations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    fetchAutomations()
  }

  const deleteAutomation = async (id: string) => {
    if (!confirm('Delete this automation?')) return
    await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    fetchAutomations()
  }

  const triggerTypes = [
    { value: 'keyword', label: 'Keyword Match', desc: 'When message contains specific word' },
    { value: 'agent_reply', label: 'After Agent Reply', desc: 'When you send a reply' },
    { value: 'customer_first', label: 'First Message', desc: 'When customer sends first message' },
  ]

  if (status === 'loading') return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="h-screen flex bg-white">
      <aside className="w-56 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-3 border-b border-gray-200">
          <Link href="/inbox" className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">MessageHub</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-2">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2">Menu</p>
          </div>
          <Link href="/inbox" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
            <span>📥</span> Inbox
          </Link>
          <Link href="/analytics" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
            <span>📊</span> Analytics
          </Link>
          <Link href="/automations" className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 font-medium">
            <span>⚡</span> Automations
          </Link>
        </div>

        <div className="p-3 border-t border-gray-200 space-y-1">
          <Link href="/settings" className="flex items-center gap-2 px-2 text-sm text-gray-600 hover:text-gray-900">
            <span>⚙</span> Settings
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {showForm ? 'Cancel' : '+ Add Automation'}
            </button>
          </div>

          {showForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Automation Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g., Greeting"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority (higher runs first)</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
                <select
                  value={form.triggerType}
                  onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {triggerTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {form.triggerType === 'keyword' && (
                  <input
                    type="text"
                    value={form.triggerValue}
                    onChange={(e) => setForm({ ...form, triggerValue: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2"
                    placeholder="Keyword to match..."
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {triggerTypes.find(t => t.value === form.triggerType)?.desc}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reply Message</label>
                <textarea
                  value={form.replyContent}
                  onChange={(e) => setForm({ ...form, replyContent: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Message to send..."
                />
              </div>

              <button
                onClick={createAutomation}
                disabled={saving || !form.name || !form.replyContent}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Automation'}
              </button>
            </div>
          )}

          {automations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">No automations yet</p>
              <p className="text-sm">Create automations to auto-reply to customers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map(auto => (
                <div key={auto.id} className={`border rounded-xl p-4 ${auto.isActive ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{auto.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${auto.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {auto.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                          {triggerTypes.find(t => t.value === auto.triggerType)?.label || auto.triggerType}
                        </span>
                        {auto.triggerValue && <span>→ "{auto.triggerValue}"</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-2 bg-white border border-gray-100 rounded p-2">
                        {auto.replyContent}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAutomation(auto.id, !auto.isActive)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {auto.isActive ? '⏸' : '▶'}
                      </button>
                      <button
                        onClick={() => deleteAutomation(auto.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}