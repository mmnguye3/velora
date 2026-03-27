import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const conversationId = req.nextUrl.searchParams.get('id')
  const { content } = await req.json()

  if (!conversationId || !content) {
    return NextResponse.json({ error: 'conversationId and content required' }, { status: 400 })
  }

  // Verify ownership
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { organizationId: true },
  })

  const orgId = (session.user as any).organizationId
  if (!conv || conv.organizationId !== orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const note = await prisma.note.create({
    data: {
      conversationId,
      authorId: userId,
      content,
    },
    include: { author: { select: { id: true, name: true } } },
  })

  return NextResponse.json(note, { status: 201 })
}