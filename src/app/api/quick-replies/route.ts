import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const replies = await prisma.quickReply.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(replies)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { title, content, category } = await req.json()

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
  }

  const reply = await prisma.quickReply.create({
    data: { organizationId: orgId, title, content, category: category || null },
  })
  return NextResponse.json(reply, { status: 201 })
}