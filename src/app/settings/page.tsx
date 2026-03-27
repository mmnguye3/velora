'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Page {
  id: string
  pageId: string
  pageName: string
  pageAvatarUrl: string | null
  createdAt: string
}

interface QuickReply {
  id: string
  title: string
  content: string
  category: string | null
  createdAt: string
}

function QuickRepliesTab() {
  const { data: session } = useSession()
  const [replies, setReplies] = useState<QuickReply[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchReplies()
  }, [])

  const fetchReplies = async () => {
    const res = await fetch('/api/quick-replies')
    const data = await res.json()
    setReplies(data)
  }

  const createReply = async () => {
    if (!form.title || !form.content) return
    setSaving(true)
    await fetch('/api/quick-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ title: '', content: '', category: '' })
    setShowForm(false)
    setSaving(false)
    fetchReplies()
  }

  const deleteReply = async (id: string) => {
    if (!confirm('Delete this quick reply?')) return
    await fetch('/api/quick-replies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchReplies()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-500">Canned responses for fast replies</p>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-blue-500 text-sm font-medium hover:underline"
        >
          {showForm ? 'Cancel' : '+ Add Quick Reply'}
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
          <div>
            <input
              type="text"
              placeholder="Title (e.g., 'Greeting')"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <textarea
              placeholder="Message content..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Category (optional)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={createReply}
            disabled={saving || !form.title || !form.content}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Quick Reply'}
          </button>
        </div>
      )}

      {replies.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">
          No quick replies yet. Create templates to reply faster.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {replies.map(reply => (
            <div key={reply.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{reply.title}</p>
                  <p className="text-gray-500 text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                  {reply.category && (
                    <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {reply.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteReply(reply.id)}
                  className="text-red-400 hover:text-red-600 text-sm ml-3"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [pages, setPages] = useState<Page[]>([])
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session && activeTab === 'channels') {
      fetchPages()
    }
  }, [session, activeTab])

  useEffect(() => {
    const error = searchParams.get('error')
    const success = searchParams.get('connected')
    if (error) alert('Failed to connect: ' + error)
    if (success) {
      alert('Page connected successfully!')
      fetchPages()
    }
  }, [searchParams])

  const fetchPages = async () => {
    const res = await fetch('/api/pages')
    const data = await res.json()
    setPages(data)
  }

  const connectFacebook = async () => {
    setConnecting(true)
    const res = await fetch('/api/pages/connect')
    const data = await res.json()
    window.location.href = data.url
  }

  const disconnectPage = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this page?')) return
    await fetch('/api/pages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchPages()
  }

  if (status === 'loading') return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )

  if (status === 'unauthenticated') router.push('/login')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'channels', label: 'Channels', icon: '📱' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'quick-replies', label: 'Quick Replies', icon: '⚡' },
    { id: 'webhook', label: 'Webhook', icon: '🔗' },
  ]

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
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2">Settings</p>
          </div>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-gray-200 space-y-1">
          <Link href="/inbox" className="flex items-center gap-2 px-2 text-sm text-gray-600 hover:text-gray-900">
            <span>←</span> Back to Inbox
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {activeTab === 'profile' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h1>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-medium">
                    {session?.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{session?.user?.name}</p>
                    <p className="text-sm text-gray-500">{session?.user?.email}</p>
                    <p className="text-xs text-blue-600 mt-1 capitalize">{session?.user?.role}</p>
                  </div>
                </div>
                <hr className="border-gray-100" />
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      defaultValue={session?.user?.name || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue={session?.user?.email || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                </div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  Save Changes
                </button>
              </div>
            </>
          )}

          {activeTab === 'channels' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-6">Connected Channels</h1>
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h2 className="text-sm font-medium text-gray-700 mb-4">Connected Facebook Pages</h2>
                {pages.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No pages connected yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pages.map(page => (
                      <div key={page.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {page.pageAvatarUrl ? (
                            <img src={page.pageAvatarUrl} className="w-10 h-10 rounded-full" alt="" />
                          ) : (
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                              {page.pageName[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{page.pageName}</p>
                            <p className="text-xs text-gray-400">ID: {page.pageId}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => disconnectPage(page.id)}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Disconnect
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-2">Connect a Facebook Page</p>
                  <p className="text-gray-400 text-sm mb-4">Link your Facebook Page to start receiving messages</p>
                  <button
                    onClick={connectFacebook}
                    disabled={connecting}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg disabled:opacity-50"
                  >
                    {connecting ? 'Connecting...' : 'Connect Facebook Page'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'team' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-6">Team Members</h1>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">Members in your organization</p>
                  <button className="text-blue-500 text-sm font-medium hover:underline">+ Add Member</button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {session?.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500">{session?.user?.email}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Admin</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'quick-replies' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-6">Quick Replies</h1>
              <QuickRepliesTab />
            </>
          )}

          {activeTab === 'webhook' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-6">Webhook Configuration</h1>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${process.env.NEXTAUTH_URL}/api/webhook`}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                    />
                    <button 
                      onClick={() => navigator.clipboard.writeText(`${process.env.NEXTAUTH_URL}/api/webhook`)}
                      className="text-blue-500 text-sm font-medium px-3"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Use this URL in Facebook Developer Portal</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verify Token</label>
                  <input
                    type="text"
                    readOnly
                    value="messagehub_verify_token_2026"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                  />
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">Setup in Facebook:</p>
                  <ol className="text-xs text-blue-600 mt-2 space-y-1">
                    <li>1. Go to developers.facebook.com → My Apps</li>
                    <li>2. Create or select your App</li>
                    <li>3. Add Webhooks product → Configure</li>
                    <li>4. Use webhook URL above and verify token</li>
                    <li>5. Subscribe to: messages, messaging_postbacks</li>
                  </ol>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}


export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>}>
      <SettingsContent />
    </Suspense>
  )
}
