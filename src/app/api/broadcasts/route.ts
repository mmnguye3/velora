import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Decrypt Facebook access token
function decryptToken(encrypted: string): string {
  const key = process.env.ENCRYPTION_KEY || 'default-key'
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.slice(0, 32)), Buffer.alloc(16, 0))
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return encrypted // Return as-is if not encrypted
  }
}

// Send message via Facebook Graph API
async function sendFacebookMessage(pageAccessToken: string, psid: string, message: string) {
  try {
    const pageToken = decryptToken(pageAccessToken)
    
    const res = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${pageToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: psid },
        message: { text: message },
      }),
    })
    
    return res.ok
  } catch (error) {
    console.error('Failed to send message:', error)
    return false
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const broadcasts = await prisma.broadcast.findMany({
    where: { organizationId: orgId },
    include: {
      facebookPage: { select: { pageName: true, pageAvatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(broadcasts)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const { name, content, pageId, filters } = await req.json()

  if (!name || !content || !pageId) {
    return NextResponse.json({ error: 'Name, content, and pageId required' }, { status: 400 })
  }

  // Get matching conversations
  const where: any = {
    organizationId: orgId,
    pageId,
  }
  
  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status
  }

  const conversations = await prisma.conversation.findMany({
    where,
    select: { id: true, psid: true },
  })

  // Create broadcast as "processing"
  const broadcast = await prisma.broadcast.create({
    data: {
      organizationId: orgId,
      name,
      content,
      pageId,
      filters: filters ? JSON.stringify(filters) : null,
      status: 'processing',
      totalRecipients: conversations.length,
    },
  })

  // Create all recipients
  for (const conv of conversations) {
    await prisma.broadcastRecipient.create({
      data: {
        broadcastId: broadcast.id,
        conversationId: conv.id,
        status: 'pending',
      },
    })
  }

  // Trigger background processing (fire and forget)
  processBroadcast(broadcast.id).catch(console.error)

  return NextResponse.json(broadcast, { status: 201 })
}

// Background processor
async function processBroadcast(broadcastId: string) {
  const BATCH_SIZE = 10 // Send 10 messages, then wait
  const DELAY_MS = 1000 // Wait 1 second between batches (rate limiting)

  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
    include: {
      facebookPage: true,
      recipients: { where: { status: 'pending' } },
    },
  })

  if (!broadcast || !broadcast.facebookPage) {
    console.error('Broadcast or page not found:', broadcastId)
    return
  }

  let delivered = 0
  let failed = 0
  const recipients = broadcast.recipients

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    
    await Promise.allSettled(
      batch.map(async (recipient) => {
        // Get conversation PSID
        const conversation = await prisma.conversation.findUnique({
          where: { id: recipient.conversationId },
          select: { psid: true },
        })

        if (!conversation) {
          await prisma.broadcastRecipient.update({
            where: { broadcastId_conversationId: { broadcastId, conversationId: recipient.conversationId } },
            data: { status: 'failed', error: 'Conversation not found' },
          })
          failed++
          return
        }

        const success = await sendFacebookMessage(
          broadcast.facebookPage!.accessToken,
          conversation.psid,
          broadcast.content
        )

        await prisma.broadcastRecipient.update({
          where: { broadcastId_conversationId: { broadcastId, conversationId: recipient.conversationId } },
          data: {
            status: success ? 'sent' : 'failed',
            sentAt: success ? new Date() : null,
            error: success ? null : 'Failed to send',
          },
        })

        if (success) delivered++
        else failed++
      })
    )

    // Rate limiting delay between batches
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }

  // Update broadcast status
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      status: 'sent',
      sentAt: new Date(),
      deliveredCount: delivered,
      failedCount: failed,
    },
  })

  console.log(`Broadcast ${broadcastId} completed: ${delivered} delivered, ${failed} failed`)
}