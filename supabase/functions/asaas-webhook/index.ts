import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
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
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
