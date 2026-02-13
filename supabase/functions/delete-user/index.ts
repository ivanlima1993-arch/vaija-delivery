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
        if (!isAdmin) throw new Error("Unauthorized: Only admins can delete users");

        const { targetUserId } = await req.json();
        if (!targetUserId) throw new Error("Missing target user ID");

        if (targetUserId === requester.id) {
            throw new Error("You cannot delete your own admin account");
        }

        // Delete the user from Auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
            targetUserId
        );

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ message: "User deleted successfully" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Delete user error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
