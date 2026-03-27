import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const conversationId = req.nextUrl.searchParams.get('id')

  if (!conversationId) {
    // Get all conversations with messages
    const status = req.nextUrl.searchParams.get('status')
    const where = { organizationId: orgId }
    if (status) Object.assign(where, { status })

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        messages: { orderBy: { sentAt: 'desc' }, take: 1 },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        conversationLabels: { include: { label: true } },
        facebookPage: { select: { pageName: true, pageAvatarUrl: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    })
    return NextResponse.json(conversations)
  }

  // Single conversation with all messages
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { sentAt: 'asc' } },
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      conversationLabels: { include: { label: true } },
      facebookPage: { select: { pageName: true, pageAvatarUrl: true } },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  })
  return NextResponse.json(conversation)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { status, assigneeId } = await req.json()
  const conversationId = req.nextUrl.searchParams.get('id')

  if (!conversationId) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Verify ownership
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { organizationId: true },
  })

  if (!conv || conv.organizationId !== orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      ...(status && { status }),
      ...(assigneeId !== undefined && { assigneeId }),
    },
  })

  return NextResponse.json(updated)
}