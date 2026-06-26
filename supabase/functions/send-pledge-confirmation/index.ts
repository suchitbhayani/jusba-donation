import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type PledgeRow = {
  name: string
  email: string
  phone: string
  amount: number
  events: { name: string } | null
}

function formatAmount(amount: number) {
  return Number(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function buildEmailHtml(pledge: PledgeRow) {
  const eventName = pledge.events?.name ?? 'your selected event'
  const amount = formatAmount(pledge.amount)

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px;">
      <h1 style="font-size: 22px; margin-bottom: 8px;">Thank you for your pledge!</h1>
      <p>Hi ${pledge.name},</p>
      <p>
        We have received your donation pledge for <strong>${eventName}</strong>.
        No payment has been collected through this form.
      </p>
      <table style="margin: 20px 0; border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Pledge amount</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Event</td>
          <td style="padding: 8px 0; text-align: right;">${eventName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Phone</td>
          <td style="padding: 8px 0; text-align: right;">${pledge.phone}</td>
        </tr>
      </table>
      <p>We appreciate your support of JUSBA.</p>
      <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
        This email confirms we recorded your pledge. If you did not submit this, you can ignore this message.
      </p>
    </div>
  `
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pledge_id } = await req.json()

    if (!pledge_id || typeof pledge_id !== 'string') {
      return new Response(JSON.stringify({ error: 'pledge_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Email service is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: pledge, error: pledgeError } = await supabase
      .from('pledges')
      .select('name, email, phone, amount, events(name)')
      .eq('id', pledge_id)
      .single()

    if (pledgeError || !pledge) {
      return new Response(JSON.stringify({ error: 'Pledge not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const from =
      Deno.env.get('PLEDGE_CONFIRMATION_FROM') ?? 'JUSBA Donations <onboarding@resend.dev>'
    const eventName = pledge.events?.name ?? 'your selected event'

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: pledge.email,
        subject: `JUSBA pledge confirmation — ${eventName}`,
        html: buildEmailHtml(pledge as PledgeRow),
      }),
    })

    if (!resendResponse.ok) {
      const details = await resendResponse.text()
      console.error('Resend error:', details)
      return new Response(JSON.stringify({ error: 'Failed to send confirmation email' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
