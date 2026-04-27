import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    console.log("Receiving WhatsApp Payload:", JSON.stringify(payload, null, 2))

    // Mapping Evolution API payload (adjust based on your version)
    const sender = payload.data?.key?.remoteJid?.split('@')[0]
    const messageText = payload.data?.message?.conversation || payload.data?.message?.extendedTextMessage?.text
    const instanceName = payload.instance
    
    if (!sender || !messageText || !instanceName) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })
    }

    // 1. Find the establishment linked to this instance
    const { data: establishment, error: estError } = await supabaseClient
      .from('establishments')
      .select('*')
      .eq('whatsapp_instance_name', instanceName)
      .single()

    if (estError || !establishment) {
      console.error("Establishment not found for instance:", instanceName)
      return new Response(JSON.stringify({ error: 'Establishment not found' }), { status: 404 })
    }

    if (!establishment.whatsapp_enabled) {
      return new Response(JSON.stringify({ status: 'Bot disabled' }), { status: 200 })
    }

    // 2. Load or Create Session
    const { data: session, error: sessionError } = await supabaseClient
      .from('whatsapp_sessions')
      .select('*')
      .eq('customer_phone', sender)
      .eq('establishment_id', establishment.id)
      .maybeSingle()

    let currentState = session?.current_state || 'start'
    let responseText = ""

    // 3. Simple State Machine
    if (currentState === 'start' || messageText.toLowerCase() === 'oi' || messageText.toLowerCase() === 'ola') {
      // Fetch products to show in welcome message
      const { data: products } = await supabaseClient
        .from('products')
        .select('name, price')
        .eq('establishment_id', establishment.id)
        .eq('is_available', true)
        .limit(10)

      const menuText = products?.map((p, i) => `${i + 1}. ${p.name} - R$ ${p.price}`).join('\n') || "Nosso cardápio está sendo atualizado."
      
      responseText = `${establishment.whatsapp_welcome_message}\n\n*Cardápio:*\n${menuText}\n\nDigite o número do item para adicionar ao pedido.`
      
      // Update session to selecting items
      await supabaseClient.from('whatsapp_sessions').upsert({
        customer_phone: sender,
        establishment_id: establishment.id,
        current_state: 'selecting_items',
        context: { items: [] }
      })
    } 
    else if (currentState === 'selecting_items') {
      // Logic to parse item number and add to cart
      // For this MVP, we simulate a simple confirmation
      const itemNumber = parseInt(messageText)
      if (!isNaN(itemNumber)) {
        responseText = `Item ${itemNumber} adicionado! Deseja mais alguma coisa ou podemos finalizar o pedido? (Digite 'finalizar' ou o número de outro item)`
      } else if (messageText.toLowerCase() === 'finalizar') {
        responseText = "Ótimo! Agora, por favor, envie o seu *Endereço de Entrega* completo."
        await supabaseClient.from('whatsapp_sessions').update({
          current_state: 'providing_address'
        }).eq('customer_phone', sender).eq('establishment_id', establishment.id)
      } else {
        responseText = "Não entendi. Digite o número do item ou 'finalizar'."
      }
    }
    else if (currentState === 'providing_address') {
      // In a real scenario, we'd calculate total and create the order
      responseText = `Entendido! Seu pedido será entregue em: ${messageText}.\n\n*Total: R$ 45,00*\nComo deseja pagar? (PIX, Dinheiro ou Cartão)`
      await supabaseClient.from('whatsapp_sessions').update({
        current_state: 'confirming_order',
        context: { ...session.context, address: messageText }
      }).eq('customer_phone', sender).eq('establishment_id', establishment.id)
    }
    else if (currentState === 'confirming_order') {
       // FINAL STEP: Create the order in Supabase
       const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          establishment_id: establishment.id,
          customer_name: "Cliente WhatsApp",
          customer_phone: sender,
          delivery_address: session.context.address,
          total: 45.00, // Mock total
          subtotal: 40.00,
          delivery_fee: 5.00,
          payment_method: 'pix', // Mocked for simplicity
          status: 'pending'
        })
        .select()
        .single()

       if (orderError) throw orderError

       responseText = establishment.whatsapp_closing_message
       
       // Reset session
       await supabaseClient.from('whatsapp_sessions').update({
         current_state: 'start',
         context: {}
       }).eq('customer_phone', sender).eq('establishment_id', establishment.id)
    }

    // 4. Send Message Back to WhatsApp (via Evolution API)
    // Note: You need to configure EVOLUTION_API_URL and API_KEY in Supabase secrets
    if (responseText) {
      const evoUrl = Deno.env.get('EVOLUTION_API_URL')
      const evoKey = Deno.env.get('EVOLUTION_API_KEY')

      if (evoUrl && evoKey) {
        await fetch(`${evoUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evoKey
          },
          body: JSON.stringify({
            number: sender,
            text: responseText
          })
        })
      } else {
        console.warn("EVOLUTION_API settings not configured. Response text:", responseText)
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
