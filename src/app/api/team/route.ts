import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  
  // Get pending invitations
  const invitations = await prisma.invitation.findMany({
    where: { organizationId: orgId, acceptedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  // Get team members
  const users = await prisma.user.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
  })

  return NextResponse.json({ users, invitations })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { email, role } = await req.json()

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 400 })

  // Check for pending invitation
  const existingInvite = await prisma.invitation.findFirst({
    where: { organizationId: orgId, email, acceptedAt: null },
  })
  if (existingInvite) return NextResponse.json({ error: 'Invitation already sent' }, { status: 400 })

  // Create invitation
  const token = crypto.randomBytes(32).toString('hex')
  const invitation = await prisma.invitation.create({
    data: {
      organizationId: orgId,
      email,
      role: role || 'agent',
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  // TODO: Send email with invitation link
  // For now, return the link
  const inviteLink = `${process.env.NEXTAUTH_URL}/register?invite=${token}`
  
  return NextResponse.json({ 
    invitation,
    inviteLink,
    message: 'Invitation created. Share the link with your team member.',
  }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { id } = await req.json()

  await prisma.invitation.deleteMany({ where: { id, organizationId: orgId } })
  return NextResponse.json({ success: true })
}