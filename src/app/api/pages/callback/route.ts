import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state') // contains orgId

  if (!code) {
    // Redirect to Facebook OAuth
    const orgId = (session.user as any).organizationId
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/pages/callback`
    
    const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_messaging,pages_show_list&state=${orgId}`
    
    return NextResponse.redirect(fbAuthUrl)
  }

  // Exchange code for access token
  try {
    const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL + '/api/pages/callback')}`)
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect('/settings?error=token_failed')
    }

    // Get user's pages
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}&fields=id,name,access_token,picture`)
    const pagesData = await pagesRes.json()

    // Save pages to database
    if (pagesData.data && state) {
      for (const page of pagesData.data) {
        await prisma.facebookPage.upsert({
          where: { organizationId_pageId: { organizationId: state, pageId: page.id } },
          update: {
            accessToken: page.access_token,
            pageName: page.name,
            pageAvatarUrl: page.picture?.data?.url,
          },
          create: {
            organizationId: state,
            pageId: page.id,
            pageName: page.name,
            pageAvatarUrl: page.picture?.data?.url,
            accessToken: page.access_token,
          },
        })
      }
    }

    return NextResponse.redirect('/settings?connected=success')
  } catch (err) {
    console.error(err)
    return NextResponse.redirect('/settings?error=connection_failed')
  }
}