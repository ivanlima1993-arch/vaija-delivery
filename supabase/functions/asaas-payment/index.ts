import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE_URL = "https://api.asaas.com/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL não configurada");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
    if (!SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY não configurada");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Token de autorização ausente" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida ou expirada" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    const asaasFetch = async (path: string, options: RequestInit = {}) => {
      console.log(`Asaas Fetch: ${path}`, options.body);
      const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          access_token: ASAAS_API_KEY,
          ...(options.headers || {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(`Asaas API error [${res.status}]:`, data);
        throw new Error(`Asaas API error [${res.status}]: ${JSON.stringify(data)}`);
      }
      return data;
    };

    // Find or create Asaas customer
    const findOrCreateCustomer = async (userId: string) => {
      console.log(`Finding or creating customer for user: ${userId}`);

      // Check if we have a stored customer ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, phone, cpf_cnpj")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }

      // Search by externalReference
      try {
        const searchRes = await asaasFetch(`/customers?externalReference=${userId}`);
        if (searchRes.data && searchRes.data.length > 0) {
          console.log(`Found existing Asaas customer: ${searchRes.data[0].id}`);
          // Update customer if cpfCnpj is missing in Asaas but present in profile
          if (!searchRes.data[0].cpfCnpj && profile?.cpf_cnpj) {
            console.log("Updating existing customer with missing CPF/CNPJ...");
            await asaasFetch(`/customers/${searchRes.data[0].id}`, {
              method: "POST",
              body: JSON.stringify({ cpfCnpj: profile.cpf_cnpj })
            });
          }
          return searchRes.data[0].id;
        }
      } catch (err) {
        console.error("Error searching customer on Asaas:", err);
      }

      // Create new customer
      console.log("Creating new Asaas customer...");
      const customer = await asaasFetch("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: profile?.full_name || "Cliente",
          phone: profile?.phone || undefined,
          cpfCnpj: profile?.cpf_cnpj || undefined,
          externalReference: userId,
          notificationDisabled: true,
        }),
      });

      console.log(`Created Asaas customer: ${customer.id}`);
      return customer.id;
    };

    if (action === "create_pix") {
      const { orderId, amount, customerName, customerCpfCnpj, cpfCnpj } = params;

      const customerId = await findOrCreateCustomer(user.id);

      // Explicitly update customer CPF if provided and missing
      const providedCpf = cpfCnpj || customerCpfCnpj;
      if (providedCpf) {
        console.log("Ensuring customer has CPF/CNPJ in Asaas for PIX order...");
        await asaasFetch(`/customers/${customerId}`, {
          method: "POST",
          body: JSON.stringify({ cpfCnpj: providedCpf })
        }).catch(err => console.error("Error updating customer CPF in Asaas:", err));
      }

      // Create PIX payment
      const payment = await asaasFetch("/payments", {
        method: "POST",
        body: JSON.stringify({
          customer: customerId,
          billingType: "PIX",
          value: amount,
          dueDate: new Date().toISOString().split("T")[0],
          description: `Pedido #${orderId}`,
          externalReference: orderId,
        }),
      });

      // Get PIX QR code
      const pixQr = await asaasFetch(`/payments/${payment.id}/pixQrCode`);

      return new Response(
        JSON.stringify({
          paymentId: payment.id,
          status: payment.status,
          pixQrCode: pixQr.encodedImage,
          pixCopyPaste: pixQr.payload,
          expirationDate: pixQr.expirationDate,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create_credit_card") {
      const {
        orderId,
        amount,
        customerName,
        customerCpfCnpj,
        cardHolder,
        cardNumber,
        expiryMonth,
        expiryYear,
        ccv,
        holderInfo,
        cpfCnpj,
      } = params;

      const customerId = await findOrCreateCustomer(user.id);

      // Explicitly update customer CPF if provided and missing
      const providedCpf = cpfCnpj || customerCpfCnpj || holderInfo?.cpfCnpj;
      if (providedCpf) {
        console.log("Ensuring customer has CPF/CNPJ in Asaas for Credit Card order...");
        await asaasFetch(`/customers/${customerId}`, {
          method: "POST",
          body: JSON.stringify({ cpfCnpj: providedCpf })
        }).catch(err => console.error("Error updating customer CPF in Asaas:", err));
      }

      const payment = await asaasFetch("/payments", {
        method: "POST",
        body: JSON.stringify({
          customer: customerId,
          billingType: "CREDIT_CARD",
          value: amount,
          dueDate: new Date().toISOString().split("T")[0],
          description: `Pedido #${orderId}`,
          externalReference: orderId,
          creditCard: {
            holderName: cardHolder,
            number: cardNumber,
            expiryMonth,
            expiryYear,
            ccv,
          },
          creditCardHolderInfo: {
            name: cardHolder,
            cpfCnpj: customerCpfCnpj || holderInfo?.cpfCnpj,
            email: holderInfo?.email || user.email,
            phone: holderInfo?.phone,
            postalCode: holderInfo?.postalCode,
            addressNumber: holderInfo?.addressNumber,
          },
        }),
      });

      return new Response(
        JSON.stringify({
          paymentId: payment.id,
          status: payment.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create_recharge") {
      const { amount, billingType, cardInfo, holderInfo, cpfCnpj } = params;

      const customerId = await findOrCreateCustomer(user.id);

      // Explicitly update customer CPF if provided and missing
      if (cpfCnpj) {
        console.log("Ensuring customer has CPF/CNPJ in Asaas...");
        await asaasFetch(`/customers/${customerId}`, {
          method: "POST",
          body: JSON.stringify({ cpfCnpj })
        }).catch(err => console.error("Error updating customer CPF in Asaas:", err));
      }

      const body: any = {
        customer: customerId,
        billingType: billingType, // "PIX" or "CREDIT_CARD"
        value: amount,
        dueDate: new Date().toISOString().split("T")[0],
        description: `Recarga de Saldo Digital`,
        externalReference: `recharge:${user.id}:${Date.now()}`,
      };

      if (billingType === "CREDIT_CARD" && cardInfo) {
        body.creditCard = {
          holderName: cardInfo.cardHolder,
          number: cardInfo.cardNumber,
          expiryMonth: cardInfo.expiryMonth,
          expiryYear: cardInfo.expiryYear,
          ccv: cardInfo.ccv,
        };
        body.creditCardHolderInfo = {
          name: cardInfo.cardHolder,
          cpfCnpj: holderInfo?.cpfCnpj,
          email: holderInfo?.email || user.email,
          phone: holderInfo?.phone,
          postalCode: holderInfo?.postalCode,
          addressNumber: holderInfo?.addressNumber,
        };
      }

      const payment = await asaasFetch("/payments", {
        method: "POST",
        body: JSON.stringify(body),
      });

      let responseData: any = {
        paymentId: payment.id,
        status: payment.status,
      };

      if (billingType === "PIX") {
        const pixQr = await asaasFetch(`/payments/${payment.id}/pixQrCode`);
        responseData = {
          ...responseData,
          pixQrCode: pixQr.encodedImage,
          pixCopyPaste: pixQr.payload,
          expirationDate: pixQr.expirationDate,
        };
      }

      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check_status") {
      const { paymentId } = params;
      const payment = await asaasFetch(`/payments/${paymentId}`);

      // Auto-credit recharge if paid
      if (
        (payment.status === "RECEIVED" || payment.status === "CONFIRMED") &&
        payment.externalReference?.startsWith("recharge:")
      ) {
        const [_, userId, timestamp] = payment.externalReference.split(":");

        // Check if transaction already exists to avoid double credit
        const { data: existing } = await supabase
          .from("wallet_transactions")
          .select("id")
          .eq("description", `Recarga Asaas ${payment.id}`)
          .single();

        if (!existing) {
          // Double verification: find the user and credit
          const { error: creditError } = await supabase
            .from("wallet_transactions")
            .insert({
              user_id: userId,
              amount: payment.value,
              type: "credit",
              description: `Recarga Asaas ${payment.id}`
            });

          if (creditError) console.error("Error crediting recharge:", creditError);
        }
      }

      return new Response(
        JSON.stringify({
          paymentId: payment.id,
          status: payment.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Asaas payment error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
