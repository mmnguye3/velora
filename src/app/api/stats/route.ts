import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Total conversations
  const totalConversations = await prisma.conversation.count({
    where: { organizationId: orgId },
  })

  // Today's conversations
  const todayConversations = await prisma.conversation.count({
    where: { 
      organizationId: orgId,
      createdAt: { gte: todayStart },
    },
  })

  // This week's conversations
  const weekConversations = await prisma.conversation.count({
    where: { 
      organizationId: orgId,
      createdAt: { gte: weekStart },
    },
  })

  // By status
  const byStatus = await prisma.conversation.groupBy({
    by: ['status'],
    where: { organizationId: orgId },
    _count: true,
  })

  // Messages today
  const todayMessages = await prisma.message.count({
    where: {
      conversation: { organizationId: orgId },
      sentAt: { gte: todayStart },
    },
  })

  // Average response time (last 7 days)
  const recentConversations = await prisma.conversation.findMany({
    where: { organizationId: orgId },
    include: { messages: { orderBy: { sentAt: 'asc' } } },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  })

  let totalResponseTime = 0
  let responseCount = 0

  for (const conv of recentConversations) {
    const firstInbound = conv.messages.find(m => m.direction === 'inbound')
    const firstOutbound = conv.messages.find(m => m.direction === 'outbound')
    
    if (firstInbound && firstOutbound) {
      const diff = new Date(firstOutbound.sentAt).getTime() - new Date(firstInbound.sentAt).getTime()
      totalResponseTime += diff
      responseCount++
    }
  }

  const avgResponseTimeMinutes = responseCount > 0 
    ? Math.round(totalResponseTime / responseCount / 60000)
    : 0

  // Team stats
  const teamMembers = await prisma.user.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      name: true,
      _count: { select: { conversations: true } },
    },
  })

  // Daily stats for last 7 days
  const dailyStats = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    
    const convs = await prisma.conversation.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    })
    
    const msgs = await prisma.message.count({
      where: {
        conversation: { organizationId: orgId },
        sentAt: { gte: dayStart, lt: dayEnd },
      },
    })

    dailyStats.push({
      date: dayStart.toISOString().split('T')[0],
      conversations: convs,
      messages: msgs,
    })
  }

  return NextResponse.json({
    overview: {
      totalConversations,
      todayConversations,
      weekConversations,
      todayMessages,
    },
    byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
    avgResponseTimeMinutes,
    teamMembers: teamMembers.map(m => ({ ...m, conversations: m._count.conversations })),
    dailyStats,
  })
}