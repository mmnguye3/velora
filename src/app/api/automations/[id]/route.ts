import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { id } = await req.json()

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await prisma.automation.deleteMany({
    where: { id, organizationId: orgId },
  })
  return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { id, isActive, ...data } = await req.json()

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const automation = await prisma.automation.updateMany({
    where: { id, organizationId: orgId },
    data,
  })
  return NextResponse.json(automation)
}