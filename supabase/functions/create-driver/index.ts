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
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error("Missing environment variables");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Verify requester is admin or franchisee
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing authorization header");

        const token = authHeader.replace("Bearer ", "");
        const { data: { user: requester }, error: authError } = await createClient(
            supabaseUrl,
            supabaseAnonKey
        ).auth.getUser(token);

        if (authError || !requester) throw new Error("Invalid token");

        const { data: roles } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", requester.id);

        const isAdmin = roles?.some((r: any) => r.role === "admin");
        const isFranchisee = roles?.some((r: any) => r.role === "franchisee");

        if (!isAdmin && !isFranchisee) {
            throw new Error("Unauthorized: Only admins or franchisees can create drivers");
        }

        const { driverData } = await req.json();

        if (!driverData?.email || !driverData?.password || !driverData?.full_name) {
            throw new Error("Missing required fields: email, password, full_name");
        }

        // 1. Create user in Auth using Admin SDK (doesn't trigger signOut on requester)
        const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email: driverData.email,
            password: driverData.password,
            email_confirm: true,
            user_metadata: {
                full_name: driverData.full_name,
            },
        });

        if (createUserError) throw createUserError;
        const newUserId = userData.user.id;

        // 2. Assign driver role
        const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
            user_id: newUserId,
            role: "driver",
        });
        if (roleError) throw roleError;

        // 3. Update profile with driver-specific data
        const profileUpdate: Record<string, any> = {
            full_name: driverData.full_name,
            is_driver_approved: false,  // Starts as pending approval
        };

        if (driverData.phone) profileUpdate.phone = driverData.phone;
        if (driverData.cpf) profileUpdate.cpf_cnpj = driverData.cpf;
        if (driverData.driver_address) profileUpdate.driver_address = driverData.driver_address;
        if (driverData.driver_vehicle_plate) profileUpdate.driver_vehicle_plate = driverData.driver_vehicle_plate;
        if (driverData.driver_birth_date) profileUpdate.driver_birth_date = driverData.driver_birth_date;

        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update(profileUpdate)
            .eq("user_id", newUserId);

        if (profileError) throw profileError;

        return new Response(
            JSON.stringify({ message: "Driver created successfully", user_id: newUserId }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error: any) {
        console.error("Create driver error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
