'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  content: string | null
  sentAt: string
  readAt: string | null
}

interface Conversation {
  id: string
  psid: string
  customerName: string | null
  customerAvatar: string | null
  status: string
  lastMessageAt: string
  messages: Message[]
  page: { pageName: string; pageAvatarUrl: string | null }
  assignee: { id: string; name: string; avatarUrl: string } | null
  labels: { label: { name: string; color: string } }[]
  notes: { id: string; content: string; createdAt: string; authorId: string }[]
}

interface QuickReply {
  id: string
  title: string
  content: string
}

interface Label {
  id: string
  name: string
  color: string
}

interface User {
  id: string
  name: string
}

export default function InboxPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [inboxFilter, setInboxFilter] = useState('all')
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [labels, setLabels] = useState<Label[]>([])
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [notes, setNotes] = useState<Conversation['notes']>([])
  const [newNote, setNewNote] = useState('')
  const [showContactPanel, setShowContactPanel] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchConversations()
      fetchQuickReplies()
      fetchLabels()
      fetchTeamMembers()
    }
  }, [session, inboxFilter])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    const res = await fetch(`/api/conversations?status=${inboxFilter === 'all' ? '' : inboxFilter}`)
    const data = await res.json()
    setConversations(data)
  }

  const fetchQuickReplies = async () => {
    const res = await fetch('/api/quick-replies')
    const data = await res.json()
    setQuickReplies(data)
  }

  const fetchLabels = async () => {
    const res = await fetch('/api/labels')
    const data = await res.json()
    setLabels(data)
  }

  const fetchTeamMembers = async () => {
    const res = await fetch('/api/team')
    const data = await res.json()
    setTeamMembers(data.users)
  }

  const openConversation = async (conv: Conversation) => {
    const res = await fetch(`/api/conversations?id=${conv.id}`)
    const data = await res.json()
    setMessages(data.messages || [])
    setSelected(data)
    setNotes(data.notes || [])
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selected) return
    setSending(true)
    await fetch(`/api/conversations/${selected.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newMessage }),
    })
    setNewMessage('')
    setSending(false)
    const res = await fetch(`/api/conversations?id=${selected.id}`)
    const data = await res.json()
    setMessages(data.messages || [])
    fetchConversations()
  }

  const sendQuickReply = async (content: string) => {
    if (!selected) return
    setSending(true)
    await fetch(`/api/conversations/${selected.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content }),
    })
    setNewMessage('')
    setShowQuickReplies(false)
    setSending(false)
    const res = await fetch(`/api/conversations?id=${selected.id}`)
    const data = await res.json()
    setMessages(data.messages || [])
    fetchConversations()
  }

  const updateStatus = async (status: string) => {
    if (!selected) return
    await fetch(`/api/conversations?id=${selected.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchConversations()
    setSelected({ ...selected, status })
  }

  const assignTo = async (userId: string | null) => {
    if (!selected) return
    await fetch(`/api/conversations?id=${selected.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId: userId }),
    })
    const res = await fetch(`/api/conversations?id=${selected.id}`)
    const data = await res.json()
    setSelected(data)
    fetchConversations()
  }

  const addNote = async () => {
    if (!newNote.trim() || !selected) return
    await fetch(`/api/conversations/${selected.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNote }),
    })
    setNewNote('')
    const res = await fetch(`/api/conversations?id=${selected.id}`)
    const data = await res.json()
    setNotes(data.notes || [])
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 1000
    if (diff < 60) return 'now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const is24HourWarning = (lastMessage: string) => {
    const diff = (new Date().getTime() - new Date(lastMessage).getTime()) / 1000
    return diff > 82800
  }

  if (status === 'loading') return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="h-screen flex bg-white">
      {/* LEFT SIDEBAR */}
      <aside className="w-56 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">MessageHub</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-2">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2">Inbox</p>
          </div>
          {[
            { key: 'all', label: 'All', icon: '◎' },
            { key: 'open', label: 'Open', icon: '◉' },
            { key: 'pending', label: 'Pending', icon: '◔' },
            { key: 'closed', label: 'Closed', icon: '✓' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setInboxFilter(item.key)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                inboxFilter === item.key
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
              {item.key === 'open' && (
                <span className="ml-auto bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {conversations.filter(c => c.status === 'open').length}
                </span>
              )}
            </button>
          ))}

          <div className="px-3 mt-4 mb-2">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2">Tools</p>
          </div>
          <a href="/automations" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
            <span className="text-xs">⚡</span> Automations
          </a>
          <a href="/broadcasts" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
            <span className="text-xs">📢</span> Broadcasts
          </a>
          <a href="/analytics" className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
            <span className="text-xs">📊</span> Analytics
          </a>
        </div>

        <div className="p-3 border-t border-gray-200 space-y-1">
          <a href="/settings" className="flex items-center gap-2 px-2 text-sm text-gray-600 hover:text-gray-900">
            <span>⚙</span> Settings
          </a>
        </div>
      </aside>

      {/* MIDDLE - Conversation List */}
      <div className="w-72 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            {inboxFilter === 'all' ? 'All Conversations' : inboxFilter.charAt(0).toUpperCase() + inboxFilter.slice(1)}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{conversations.length} conversations</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              No conversations yet
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selected?.id === conv.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                    {conv.customerAvatar ? (
                      <img src={conv.customerAvatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                    ) : (
                      getInitials(conv.customerName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 text-sm truncate">
                        {conv.customerName || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-xs text-gray-500 truncate flex-1">
                        {conv.messages[0]?.content?.slice(0, 30) || 'No messages'}
                      </p>
                      {conv.assignee && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">
                          {conv.assignee.name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT - Chat View */}
      {selected ? (
        <>
          <main className="flex-1 flex flex-col bg-white">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                  {getInitials(selected.customerName)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {selected.customerName || 'Unknown'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">{selected.page?.pageName}</p>
                    {selected.status === 'open' && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {is24HourWarning(selected.lastMessageAt) && selected.status === 'open' && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                    ⚠ 24h
                  </span>
                )}
                <button
                  onClick={() => setShowContactPanel(!showContactPanel)}
                  className={`p-2 rounded-lg ${showContactPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Toggle contact panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <select
                  value={selected.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-3 py-2 rounded-lg text-sm ${
                    msg.direction === 'outbound'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content || '[Attachment]'}</p>
                    <p className={`text-[10px] mt-1 ${msg.direction === 'outbound' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {formatTime(msg.sentAt)}
                      {msg.direction === 'outbound' && msg.readAt && ' · Read'}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input with Quick Replies */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              {showQuickReplies && quickReplies.length > 0 && (
                <div className="mb-3 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                  {quickReplies.map(qr => (
                    <button
                      key={qr.id}
                      onClick={() => sendQuickReply(qr.content)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900">{qr.title}</p>
                      <p className="text-xs text-gray-500 truncate">{qr.content}</p>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className={`p-2 rounded-lg transition-colors ${showQuickReplies ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Quick replies"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </main>

          {/* Contact Details Panel */}
          {showContactPanel && (
            <aside className="w-64 border-l border-gray-200 bg-white flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 text-sm">Contact Details</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Assignee */}
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Assignee</label>
                  <select
                    value={selected.assignee?.id || ''}
                    onChange={(e) => assignTo(e.target.value || null)}
                    className="w-full mt-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                {/* Labels */}
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Labels</label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {labels.map(label => (
                      <span
                        key={label.id}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: label.color + '20', color: label.color }}
                      >
                        {label.name}
                      </span>
                    ))}
                    {labels.length === 0 && (
                      <p className="text-xs text-gray-400">No labels</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Notes</label>
                  <div className="mt-2 space-y-2">
                    {notes.map(note => (
                      <div key={note.id} className="p-2 bg-yellow-50 border border-yellow-100 rounded text-xs">
                        <p className="text-gray-700">{note.content}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatTime(note.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full mt-2 border border-gray-300 rounded px-2 py-1.5 text-xs"
                    rows={2}
                  />
                  <button
                    onClick={addNote}
                    disabled={!newNote.trim()}
                    className="mt-1 text-xs text-blue-500 hover:underline disabled:opacity-50"
                  >
                    Add note
                  </button>
                </div>

                {/* Customer Info */}
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Customer ID</label>
                  <p className="text-xs text-gray-600 mt-1 font-mono">{selected.psid}</p>
                </div>
              </div>
            </aside>
          )}
        </>
      ) : (
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Select a conversation</p>
            <p className="text-gray-400 text-sm mt-1">Choose from the list to start chatting</p>
          </div>
        </main>
      )}
    </div>
  )
}