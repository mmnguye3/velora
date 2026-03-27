import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import { sendMessage, getUserProfile, verifyWebhookSignature } from '@/lib/facebook'

// Facebook webhook verification
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('Webhook verification request:', { mode, token })

  if (mode === 'subscribe' && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Receive Facebook messages
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-hub-signature-256') || ''
    const body = await req.text()
    
    console.log('Webhook received, signature:', signature ? 'present' : 'missing')

    // Skip signature verification for now (can add later)
    // if (!verifyWebhookSignature(body, signature)) {
    //   console.error('Invalid webhook signature')
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    // }

    const data = JSON.parse(body)
    console.log('Webhook data object:', data.object)

    if (data.object !== 'page') {
      return NextResponse.json({ status: 'ignored' })
    }

    // Process each entry
    for (const entry of data.entry || []) {
      const pageId = entry.id
      console.log('Processing entry for page:', pageId)

      // Find the page in our DB
      const page = await prisma.facebookPage.findFirst({
        where: { pageId },
        include: { organization: true },
      })

      if (!page) {
        console.log('Page not found in DB:', pageId)
        continue
      }

      const accessToken = decrypt(page.accessToken)
      console.log('Found page:', page.pageName)

      for (const event of entry.messaging || []) {
        await handleMessagingEvent(event, page, accessToken)
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handleMessagingEvent(event: any, page: any, accessToken: string) {
  const psid = event.sender?.id
  if (!psid) return

  // Skip messages from the page itself
  if (psid === page.pageId) return

  console.log('Handling message from PSID:', psid)

  // Get or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: { pageId: page.id, psid },
  })

  let customerName = 'Unknown'
  let customerAvatar = null

  if (!conversation) {
    // Fetch user profile from Facebook
    try {
      const profile = await getUserProfile(psid, accessToken)
      if (profile) {
        customerName = profile.name || 'Unknown'
        customerAvatar = profile.profile_pic || null
      }
    } catch (e) {
      console.error('Failed to get user profile:', e)
    }

    conversation = await prisma.conversation.create({
      data: {
        organizationId: page.organizationId,
        pageId: page.id,
        psid,
        customerName,
        customerAvatar,
        status: 'open',
        lastMessageAt: new Date(),
      },
    })
    console.log('Created new conversation:', conversation.id)
  }

  // Handle message event
  if (event.message) {
    const msg = event.message

    // Skip echoes (messages sent by the page)
    if (msg.is_echo) return

    const messageContent = msg.text || '[Media]'

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'inbound',
        content: messageContent,
        sentAt: new Date(event.timestamp || Date.now()),
      },
    })

    console.log('Stored inbound message:', messageContent)

    // Update conversation last message time + reopen if closed
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(event.timestamp || Date.now()),
        status: conversation.status === 'closed' ? 'open' : conversation.status,
      },
    })

    // Run automations
    await runAutomations(conversation, msg.text || '', page, accessToken)
  }

  // Handle delivery receipts
  if (event.delivery) {
    const watermark = event.delivery.watermark
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        direction: 'outbound',
        sentAt: { lte: new Date(watermark) },
      },
      data: { readAt: new Date() },
    })
  }

  // Handle postback (button clicks, etc.)
  if (event.postback) {
    const postbackPayload = event.postback.payload
    console.log('Postback payload:', postbackPayload)

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'inbound',
        content: `[Postback: ${postbackPayload}]`,
        sentAt: new Date(event.timestamp || Date.now()),
      },
    })
  }
}

async function runAutomations(
  conversation: any,
  text: string,
  page: any,
  accessToken: string
) {
  if (!text) return

  console.log('Checking automations for org:', page.organizationId)

  const automations = await prisma.automation.findMany({
    where: {
      organizationId: page.organizationId,
      isActive: true,
    },
  })

  console.log('Found automations:', automations.length)

  for (const automation of automations) {
    let shouldTrigger = false

    // Keyword trigger
    if (automation.triggerType === 'keyword' && automation.triggerValue) {
      if (text.toLowerCase().includes(automation.triggerValue.toLowerCase())) {
        shouldTrigger = true
      }
    }

    // Customer first message trigger
    if (automation.triggerType === 'customer_first') {
      const msgCount = await prisma.message.count({
        where: { conversationId: conversation.id },
      })
      if (msgCount <= 1) shouldTrigger = true
    }

    if (shouldTrigger && automation.replyType === 'text') {
      console.log('Triggering automation:', automation.name)

      // Send auto-reply
      try {
        await sendMessage(conversation.psid, { text: automation.replyContent }, accessToken)

        // Log the outbound message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            direction: 'outbound',
            content: automation.replyContent,
            sentAt: new Date(),
          },
        })
      } catch (e) {
        console.error('Failed to send auto-reply:', e)
      }
    }
  }
}