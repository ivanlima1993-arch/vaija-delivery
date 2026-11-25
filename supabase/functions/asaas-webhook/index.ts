import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    const configuredWebhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
    if (configuredWebhookToken) {
      const webhookToken = req.headers.get('asaas-access-token') ?? req.headers.get('access_token')
      if (webhookToken !== configuredWebhookToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized webhook' }), { status: 401 })
      }
    }

    const body = await req.json()
    console.log('Webhook received:', body)

    const event = body.event
    const payment = body.payment

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const paymentId = payment.id
      
      // Update status to 'confirmed'. The database trigger will handle the balance update.
      const { data: transaction, error: updateError } = await supabaseAdmin
        .from('wallet_transactions')
        .update({ status: 'confirmed' })
        .eq('asaas_payment_id', paymentId)
        .eq('status', 'pending')
        .select()
        .single()

      if (updateError) {
        console.log('Transaction not found or already confirmed:', paymentId)
      } else if (transaction) {
        console.log('Payment confirmed and balance updated via trigger for:', paymentId)
      }

      if (payment.externalReference && !payment.externalReference.startsWith('recharge:')) {
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('id, total')
          .eq('id', payment.externalReference)
          .maybeSingle()

        if (order && Number(payment.value) > 0 &&
            Math.abs(Number(order.total) - Number(payment.value)) <= 0.01) {
          await supabaseAdmin
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', order.id)
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
