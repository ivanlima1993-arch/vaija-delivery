import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_URL = Deno.env.get('ASAAS_URL') || 'https://sandbox.asaas.com/api/v3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const body = await req.json()
    const { amount, paymentMethod, providerId, cardData } = body

    // 1. Get or Create Customer in Asaas
    const { data: provider } = await supabaseClient
      .from('service_providers')
      .select('*, auth_users(email)')
      .eq('id', providerId)
      .single()

    let asaasCustomerId = provider.asaas_customer_id

    if (!asaasCustomerId) {
      const customerResp = await fetch(`${ASAAS_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY!,
        },
        body: JSON.stringify({
          name: provider.name || provider.full_name,
          cpfCnpj: provider.cpf?.replace(/\D/g, ''),
          email: provider.email || user.email,
          mobilePhone: provider.phone?.replace(/\D/g, ''),
        }),
      })
      const customer = await customerResp.json()
      if (customer.errors) throw new Error(customer.errors[0].description)
      
      asaasCustomerId = customer.id
      await supabaseClient
        .from('service_providers')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', providerId)
    }

    // 2. Create Payment
    const paymentData: any = {
      customer: asaasCustomerId,
      billingType: paymentMethod === 'pix' ? 'PIX' : 'CREDIT_CARD',
      value: amount,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0], // 1 day from now
      externalReference: providerId,
    }

    if (paymentMethod === 'card') {
      paymentData.creditCard = {
        holderName: cardData.holderName,
        number: cardData.number.replace(/\s/g, ''),
        expiryMonth: cardData.expiry.split('/')[0],
        expiryYear: '20' + cardData.expiry.split('/')[1],
        cvv: cardData.cvv,
      }
      paymentData.creditCardHolderInfo = {
        name: cardData.holderName,
        email: provider.email || user.email,
        cpfCnpj: provider.cpf?.replace(/\D/g, ''),
        postalCode: provider.postal_code || '00000000',
        addressNumber: provider.address_number || 'S/N',
        mobilePhone: provider.phone?.replace(/\D/g, ''),
      }
    }

    const paymentResp = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY!,
      },
      body: JSON.stringify(paymentData),
    })

    const payment = await paymentResp.json()
    if (payment.errors) throw new Error(payment.errors[0].description)

    // 3. Get PIX details if needed
    let pixDetails = null
    if (paymentMethod === 'pix') {
      const pixResp = await fetch(`${ASAAS_URL}/payments/${payment.id}/pixQrCode`, {
        method: 'GET',
        headers: {
          'access_token': ASAAS_API_KEY!,
        },
      })
      pixDetails = await pixResp.json()
    }

    // 4. Record Transaction
    await supabaseClient.from('wallet_transactions').insert({
      user_id: user.id,
      provider_id: providerId,
      amount: amount,
      payment_method: paymentMethod,
      status: 'pending',
      asaas_payment_id: payment.id,
      asaas_invoice_url: payment.invoiceUrl,
      pix_qr_code: pixDetails?.encodedImage,
      pix_copy_paste: pixDetails?.payload,
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        pixDetails: pixDetails 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
