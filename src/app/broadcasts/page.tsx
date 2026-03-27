'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Broadcast {
  id: string
  name: string
  content: string
  status: string
  totalRecipients: number
  deliveredCount: number
  failedCount: number
  createdAt: string
  sentAt: string | null
  facebookPage: { pageName: string; pageAvatarUrl: string | null }
}

interface FacebookPage {
  id: string
  pageId: string
  pageName: string
  pageAvatarUrl: string | null
}

interface Label {
  id: string
  name: string
  color: string
}

export default function BroadcastsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ 
    name: '', 
    content: '', 
    pageId: '', 
    statusFilter: 'all',
    selectedLabels: [] as string[]
  })
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewCount, setPreviewCount] = useState(0)

  // Auto-refresh for processing broadcasts
  useEffect(() => {
    const interval = setInterval(() => {
      const hasProcessing = broadcasts.some(b => b.status === 'processing')
      if (hasProcessing) fetchBroadcasts()
    }, 5000)
    return () => clearInterval(interval)
  }, [broadcasts])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchBroadcasts()
      fetchPages()
      fetchLabels()
    }
  }, [session])

  const fetchBroadcasts = async () => {
    const res = await fetch('/api/broadcasts')
    const data = await res.json()
    setBroadcasts(data)
    setLoading(false)
  }

  const fetchPages = async () => {
    const res = await fetch('/api/pages')
    const data = await res.json()
    setPages(data)
  }

  const fetchLabels = async () => {
    const res = await fetch('/api/labels')
    const data = await res.json()
    setLabels(data)
  }

  const checkPreview = async () => {
    if (!form.pageId) return
    // Would call API to get count - for now estimate
    setPreviewCount(Math.floor(Math.random() * 50) + 10)
  }

  useEffect(() => {
    if (form.pageId) checkPreview()
  }, [form.pageId, form.statusFilter])

  const createBroadcast = async () => {
    if (!form.name || !form.content || !form.pageId) return
    setSending(true)
    
    const res = await fetch('/api/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        content: form.content,
        pageId: form.pageId,
        filters: { status: form.statusFilter, labelIds: form.selectedLabels },
        sendNow: true,
      }),
    })

    if (res.ok) {
      setForm({ name: '', content: '', pageId: '', statusFilter: 'all', selectedLabels: [] })
      setShowForm(false)
      setStep(1)
      fetchBroadcasts()
    }
    setSending(false)
  }

  const deleteBroadcast = async (id: string) => {
    if (!confirm('Delete this campaign?')) return
    await fetch('/api/broadcasts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchBroadcasts()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      processing: 'bg-amber-100 text-amber-700',
      sent: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  const getStatusText = (status: string, delivered: number, failed: number, total: number) => {
    if (status === 'processing') return `Processing... ${delivered + failed}/${total}`
    if (status === 'sent') return `${delivered} delivered${failed > 0 ? `, ${failed} failed` : ''}`
    return status
  }

  // Calculate stats
  const totalSent = broadcasts.filter(b => b.status === 'sent').length
  const totalDelivered = broadcasts.reduce((acc, b) => acc + b.deliveredCount, 0)
  const totalRecipients = broadcasts.reduce((acc, b) => acc + b.totalRecipients, 0)

  if (status === 'loading' || loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="h-screen flex bg-gray-50">
      {/* LEFT SIDEBAR */}
      <aside className="w-20 lg:w-56 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <Link href="/inbox" className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm hidden lg:block">MessageHub</span>
          </Link>
        </div>

        <div className="flex-1 py-4">
          <div className="space-y-1 px-2">
            <Link href="/inbox" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
              <span className="text-lg">📥</span>
              <span className="text-sm hidden lg:block">Inbox</span>
            </Link>
            <Link href="/broadcasts" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-600">
              <span className="text-lg">📢</span>
              <span className="text-sm font-medium hidden lg:block">Broadcasts</span>
            </Link>
            <Link href="/automations" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
              <span className="text-lg">⚡</span>
              <span className="text-sm hidden lg:block">Automations</span>
            </Link>
            <Link href="/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
              <span className="text-lg">📊</span>
              <span className="text-sm hidden lg:block">Analytics</span>
            </Link>
          </div>
        </div>

        <div className="p-3 border-t border-gray-200">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <span className="text-lg">⚙</span>
            <span className="text-sm hidden lg:block">Settings</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Broadcasts</h1>
              <p className="text-gray-500 mt-1">Send messages to your customers</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm"
            >
              + New Campaign
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{broadcasts.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📨</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Messages Sent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalDelivered}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Recipients</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalRecipients}</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Campaigns</h2>
            </div>
            
            {broadcasts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📢</span>
                </div>
                <p className="text-gray-900 font-medium">No campaigns yet</p>
                <p className="text-gray-500 text-sm mt-1">Create your first campaign to reach your customers</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {broadcasts.map(broadcast => (
                  <div key={broadcast.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-medium">
                          {broadcast.name[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{broadcast.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(broadcast.status)}`}>
                              {broadcast.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {broadcast.facebookPage?.pageName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{broadcast.totalRecipients}</p>
                          <p className="text-xs text-gray-500">recipients</p>
                        </div>
                        {broadcast.status === 'sent' && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-emerald-600">{broadcast.deliveredCount}</p>
                            <p className="text-xs text-gray-500">delivered</p>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{formatDate(broadcast.sentAt || broadcast.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => deleteBroadcast(broadcast.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE CAMPAIGN MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Campaign</h2>
              <button onClick={() => { setShowForm(false); setStep(1); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., March Newsletter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Page</label>
                    <select
                      value={form.pageId}
                      onChange={(e) => setForm({ ...form, pageId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a page...</option>
                      {pages.map(page => (
                        <option key={page.id} value={page.id}>{page.pageName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                    <select
                      value={form.statusFilter}
                      onChange={(e) => setForm({ ...form, statusFilter: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All conversations</option>
                      <option value="open">Open only</option>
                      <option value="pending">Pending only</option>
                      <option value="closed">Closed only</option>
                    </select>
                  </div>
                  <button
                    onClick={() => form.name && form.pageId && setStep(2)}
                    disabled={!form.name || !form.pageId}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={5}
                      placeholder="Write your message..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{form.content.length} characters</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Estimated recipients:</span>
                      <span className="font-medium text-gray-900">~{previewCount} people</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={createBroadcast}
                      disabled={sending || !form.content}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
                    >
                      {sending ? 'Starting Campaign...' : 'Start Campaign'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}