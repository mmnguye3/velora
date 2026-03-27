import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, inviteToken } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 })
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Handle invitation
    let organizationId = null
    let role = 'agent'

    if (inviteToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { token: inviteToken },
      })

      if (!invitation) {
        return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 })
      }

      if (invitation.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })
      }

      if (invitation.acceptedAt) {
        return NextResponse.json({ error: 'Invitation already used' }, { status: 400 })
      }

      organizationId = invitation.organizationId
      role = invitation.role

      // Accept invitation
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      })
    } else {
      // Create new organization
      const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`
      const org = await prisma.organization.create({
        data: { name, slug },
      })
      organizationId = org.id
      role = 'admin'
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        organizationId,
      },
    })

    return NextResponse.json({ 
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}