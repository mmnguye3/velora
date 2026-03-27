import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getPageAccessToken, exchangeLongLivedToken } from '@/lib/facebook'
import { encrypt } from '@/lib/crypto'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const pages = await prisma.facebookPage.findMany({
    where: { organizationId: orgId },
    select: { id: true, pageId: true, pageName: true, pageAvatarUrl: true, createdAt: true },
  })

  return NextResponse.json(pages)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { userAccessToken } = await req.json()

  try {
    // Exchange for long-lived token
    const longLivedToken = await exchangeLongLivedToken(userAccessToken)

    // Get all pages
    const pages = await getPageAccessToken(longLivedToken)

    const created = []
    for (const page of pages) {
      const existing = await prisma.facebookPage.findFirst({
        where: { organizationId: orgId, pageId: page.id },
      })

      if (!existing) {
        const newPage = await prisma.facebookPage.create({
          data: {
            organizationId: orgId,
            pageId: page.id,
            pageName: page.name,
            pageAvatarUrl: page.picture?.data?.url || null,
            accessToken: encrypt(page.access_token),
          },
        })
        created.push({ id: newPage.id, pageName: newPage.pageName })
      }
    }

    return NextResponse.json({ connected: created })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to connect pages' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { id } = await req.json()

  await prisma.facebookPage.deleteMany({ where: { id, organizationId: orgId } })

  return NextResponse.json({ ok: true })
}
