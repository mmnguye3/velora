import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { sendMessage } from '@/lib/facebook'
import { decrypt } from '@/lib/crypto'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const orgId = (session.user as any).organizationId
  const { text } = await req.json()

  if (!text?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const conversation = await prisma.conversation.findFirst({
    where: { id, organizationId: orgId },
    include: { facebookPage: true },
  })

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const accessToken = decrypt(conversation.facebookPage.accessToken)
  await sendMessage(conversation.psid, { text }, accessToken)

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: 'outbound',
      content: text,
      senderId: (session.user as any).id,
      sentAt: new Date(),
    },
  })

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  })

  return NextResponse.json(message, { status: 201 })
}
