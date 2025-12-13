// Supabase Edge Function: MSG91 SMS Hook
// This function receives OTP requests from Supabase Auth and sends SMS via MSG91

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MSG91_API_URL = 'https://control.msg91.com/api/v5/flow'
const MSG91_AUTH_KEY = Deno.env.get('MSG91_AUTH_KEY')!
const MSG91_TEMPLATE_ID = Deno.env.get('MSG91_TEMPLATE_ID')!

interface WebhookPayload {
  user: {
    phone: string
  }
  sms: {
    otp: string
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    // Verify the request is a POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse the webhook payload from Supabase
    const payload: WebhookPayload = await req.json()
    console.log('[SMS Hook] Received request for phone:', payload.user.phone)

    // Extract phone number - remove '+' prefix if present
    let phoneNumber = payload.user.phone.replace(/^\+/, '')
    
    // Ensure it starts with country code (91 for India)
    if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
      phoneNumber = '91' + phoneNumber
    }

    // Prepare MSG91 request body
    const msg91Body = {
      template_id: MSG91_TEMPLATE_ID,
      short_url: '1',
      recipients: [
        {
          mobiles: phoneNumber,
          VAR1: payload.sms.otp, // OTP variable in MSG91 template
        },
      ],
    }

    console.log('[SMS Hook] Sending to MSG91:', phoneNumber)

    // Send request to MSG91
    const msg91Response = await fetch(MSG91_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': MSG91_AUTH_KEY,
      },
      body: JSON.stringify(msg91Body),
    })

    const msg91Result = await msg91Response.json()
    console.log('[SMS Hook] MSG91 response:', JSON.stringify(msg91Result))

    // Check if MSG91 request was successful
    if (!msg91Response.ok || msg91Result.type === 'error') {
      console.error('[SMS Hook] MSG91 error:', msg91Result)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send SMS',
          details: msg91Result 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Return success response to Supabase
    console.log('[SMS Hook] SMS sent successfully')
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'SMS sent via MSG91',
        request_id: msg91Result.request_id 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[SMS Hook] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
