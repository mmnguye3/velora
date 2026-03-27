'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Stats {
  overview: { totalConversations: number; todayConversations: number; weekConversations: number; todayMessages: number }
  byStatus: Record<string, number>
  avgResponseTimeMinutes: number
  teamMembers: { id: string; name: string; conversations: number }[]
  dailyStats: { date: string; conversations: number; messages: number }[]
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session) fetchStats()
  }, [session])

  const fetchStats = async () => {
    const res = await fetch('/api/stats')
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  if (status === 'loading' || loading || !stats) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )

  const statCards = [
    { label: 'Total Conversations', value: stats.overview.totalConversations, color: 'blue' },
    { label: 'Today', value: stats.overview.todayConversations, color: 'green' },
    { label: 'This Week', value: stats.overview.weekConversations, color: 'purple' },
    { label: 'Messages Today', value: stats.overview.todayMessages, color: 'orange' },
    { label: 'Avg Response Time', value: `${stats.avgResponseTimeMinutes}m`, color: 'cyan' },
  ]

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  }

  const statusColors: Record<string, {bg: string; text: string; label: string}> = {
    open: { bg: 'bg-green-500', text: 'text-green-600', label: 'Open' },
    pending: { bg: 'bg-yellow-500', text: 'text-yellow-600', label: 'Pending' },
    closed: { bg: 'bg-gray-500', text: 'text-gray-600', label: 'Closed' },
  }

  const maxDaily = Math.max(...stats.dailyStats.map(d => d.conversations), 1)

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
          <Link href="/analytics" className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 font-medium">
            <span>📊</span> Analytics
          </Link>
        </div>

        <div className="p-3 border-t border-gray-200 space-y-1">
          <Link href="/settings" className="flex items-center gap-2 px-2 text-sm text-gray-600 hover:text-gray-900">
            <span>⚙</span> Settings
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map(card => (
              <div key={card.label} className={`p-4 rounded-xl ${colorClasses[card.color]}`}>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm opacity-80">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">By Status</h2>
              <div className="space-y-3">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${statusColors[status]?.bg || 'bg-gray-500'}`} />
                      <span className="text-sm text-gray-600">{statusColors[status]?.label || status}</span>
                    </div>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Last 7 Days</h2>
              <div className="flex items-end justify-between gap-2 h-32">
                {stats.dailyStats.map(day => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${(day.conversations / maxDaily) * 100}%`, minHeight: day.conversations > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-gray-400">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Performance */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.teamMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {member.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.conversations} conversations</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}