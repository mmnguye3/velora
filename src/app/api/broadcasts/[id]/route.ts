import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { id } = await req.json()

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await prisma.broadcast.deleteMany({
    where: { id, organizationId: orgId },
  })
  return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { id, ...data } = await req.json()

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Only allow updating draft broadcasts
  const existing = await prisma.broadcast.findFirst({
    where: { id, organizationId: orgId },
  })

  if (existing?.status !== 'draft') {
    return NextResponse.json({ error: 'Can only update draft broadcasts' }, { status: 400 })
  }

  const broadcast = await prisma.broadcast.update({
    where: { id, organizationId: orgId },
    data,
  })

  return NextResponse.json(broadcast)
}