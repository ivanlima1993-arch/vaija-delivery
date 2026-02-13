import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error("Missing environment variables");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Verify if the requester is an admin
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing authorization header");

        const token = authHeader.replace("Bearer ", "");
        const { data: { user: requester }, error: authError } = await createClient(
            supabaseUrl,
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        ).auth.getUser(token);

        if (authError || !requester) throw new Error("Invalid token");

        const { data: roles } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", requester.id);

        const isAdmin = roles?.some((r) => r.role === "admin");
        if (!isAdmin) throw new Error("Unauthorized: Only admins can create establishments");

        const { ownerData, establishmentData } = await req.json();

        // 1. Create owner user in Auth using Admin SDK (doesn't trigger signOut)
        const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email: ownerData.email,
            password: ownerData.password,
            email_confirm: true,
            user_metadata: {
                full_name: ownerData.fullName,
            },
        });

        if (createUserError) throw createUserError;
        const newUserId = userData.user.id;

        // 2. Set establishment role
        const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
            user_id: newUserId,
            role: "establishment",
        });
        if (roleError) throw roleError;

        // 3. Update profile if phone provided
        if (ownerData.phone) {
            await supabaseAdmin
                .from("profiles")
                .update({ phone: ownerData.phone })
                .eq("user_id", newUserId);
        }

        // 4. Create establishment record
        const { data: establishment, error: establishmentError } = await supabaseAdmin
            .from("establishments")
            .insert({
                owner_id: newUserId,
                name: establishmentData.name,
                description: establishmentData.description || null,
                category: establishmentData.category || "restaurant",
                phone: establishmentData.phone || null,
                address: establishmentData.address || null,
                neighborhood: establishmentData.neighborhood || null,
                city: establishmentData.city || null,
                city_id: establishmentData.cityId || null,
                delivery_fee: Number(establishmentData.deliveryFee) || 0,
                min_order_value: Number(establishmentData.minOrderValue) || 0,
                min_delivery_time: Number(establishmentData.minDeliveryTime) || 30,
                max_delivery_time: Number(establishmentData.maxDeliveryTime) || 60,
                is_approved: establishmentData.is_approved ?? true,
                opening_hours: establishmentData.opening_hours || {},
                logo_url: establishmentData.logo_url || null,
                cover_url: establishmentData.cover_url || null,
            })
            .select()
            .single();

        if (establishmentError) throw establishmentError;

        return new Response(JSON.stringify({ message: "Establishment created successfully", establishment }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Create establishment error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
