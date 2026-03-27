import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Decrypt Facebook access token (simple XOR for demo - use proper encryption in prod)
function decryptToken(encrypted: string): string {
  const key = process.env.ENCRYPTION_KEY || 'default-key'
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.slice(0, 32)), Buffer.alloc(16, 0))
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// Send message via Facebook Graph API
async function sendFacebookMessage(pageAccessToken: string, psid: string, message: string) {
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
}

// Check automations and send auto-reply if matched
async function runAutomations(conversationId: string, message: string, isInbound: boolean) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      facebookPage: true,
      organization: { include: { automations: true } },
    },
  })

  if (!conversation) return

  const automations = conversation.organization.automations
    .filter(a => a.isActive)
    .sort((a, b) => b.priority - a.priority)

  let matchedReply = null

  for (const auto of automations) {
    let shouldTrigger = false

    // Keyword trigger: trigger on inbound messages containing keyword
    if (auto.triggerType === 'keyword' && isInbound) {
      if (auto.triggerValue && message.toLowerCase().includes(auto.triggerValue.toLowerCase())) {
        shouldTrigger = true
      }
    }
    
    // Agent reply trigger: trigger when agent responds
    if (auto.triggerType === 'agent_reply' && !isInbound) {
      shouldTrigger = true
    }

    // Customer first message: trigger on first message in conversation
    if (auto.triggerType === 'customer_first' && isInbound) {
      const msgCount = await prisma.message.count({ where: { conversationId } })
      if (msgCount <= 1) shouldTrigger = true
    }

    if (shouldTrigger) {
      if (auto.replyType === 'text') {
        matchedReply = auto.replyContent
        break // Only first matched automation
      }
    }
  }

  if (matchedReply) {
    await sendFacebookMessage(
      conversation.facebookPage.accessToken,
      conversation.psid,
      matchedReply
    )

    // Log the auto-reply as outbound message
    await prisma.message.create({
      data: {
        conversationId,
        direction: 'outbound',
        content: matchedReply,
      },
    })
  }
}

export { runAutomations }