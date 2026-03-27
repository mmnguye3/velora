import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const automations = await prisma.automation.findMany({
    where: { organizationId: orgId },
    orderBy: { priority: 'desc' },
  })
  return NextResponse.json(automations)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { name, triggerType, triggerValue, replyType, replyContent, priority, isActive } = await req.json()

  if (!name || !triggerType || !replyType || !replyContent) {
    return NextResponse.json({ error: 'Name, triggerType, replyType, and replyContent required' }, { status: 400 })
  }

  const automation = await prisma.automation.create({
    data: {
      organizationId: orgId,
      name,
      triggerType,
      triggerValue: triggerValue || null,
      replyType,
      replyContent,
      priority: priority || 0,
      isActive: isActive !== false,
    },
  })
  return NextResponse.json(automation, { status: 201 })
}