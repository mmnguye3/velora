import axios from 'axios'

const GRAPH_API_VERSION = 'v18.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface SendMessagePayload {
  text?: string
  attachment?: {
    type: string
    payload: { url: string }
  }
  quick_replies?: Array<{
    content_type: string
    title: string
    payload: string
  }>
}

export async function sendMessage(
  psid: string,
  message: SendMessagePayload,
  pageAccessToken: string
): Promise<{ message_id: string }> {
  const response = await axios.post(
    `${GRAPH_API_BASE}/me/messages`,
    {
      recipient: { id: psid },
      message,
      messaging_type: 'RESPONSE',
    },
    {
      params: { access_token: pageAccessToken },
    }
  )
  return response.data
}

export async function getUserProfile(
  psid: string,
  pageAccessToken: string
): Promise<{ name: string; profile_pic: string } | null> {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${psid}`, {
      params: {
        fields: 'name,profile_pic',
        access_token: pageAccessToken,
      },
    })
    return response.data
  } catch {
    return null
  }
}

export async function getPageAccessToken(
  userAccessToken: string
): Promise<Array<{ id: string; name: string; access_token: string; picture: { data: { url: string } } }>> {
  const response = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
    params: {
      fields: 'id,name,access_token,picture',
      access_token: userAccessToken,
    },
  })
  return response.data.data
}

export async function exchangeLongLivedToken(shortLivedToken: string): Promise<string> {
  const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    },
  })
  return response.data.access_token
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FACEBOOK_APP_SECRET || '')
    .update(payload)
    .digest('hex')
  return `sha256=${expectedSignature}` === signature
}
