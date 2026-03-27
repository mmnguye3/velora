import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const pageId = searchParams.get('pageId')
  const assigneeId = searchParams.get('assigneeId')

  const orgId = (session.user as any).organizationId

  const conversations = await prisma.conversation.findMany({
    where: {
      organizationId: orgId,
      ...(status && { status }),
      ...(pageId && { pageId }),
      ...(assigneeId && { assigneeId }),
    },
    include: {
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      facebookPage: { select: { id: true, pageName: true, pageAvatarUrl: true } },
      conversationLabels: { include: { label: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  return NextResponse.json(conversations)
}
