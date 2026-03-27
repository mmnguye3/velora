import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const labels = await prisma.label.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(labels)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { name, color } = await req.json()

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const label = await prisma.label.create({
    data: { organizationId: orgId, name, color: color || '#6366f1' },
  })
  return NextResponse.json(label, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { id } = await req.json()

  await prisma.label.deleteMany({ where: { id, organizationId: orgId } })
  return NextResponse.json({ success: true })
}