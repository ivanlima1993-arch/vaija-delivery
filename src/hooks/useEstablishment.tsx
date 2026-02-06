import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Establishment = Database["public"]["Tables"]["establishments"]["Row"];

export const useEstablishment = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isEstablishment } = useAuth();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user && !isEstablishment) {
      toast.error("Você não tem acesso a esta área");
      navigate("/");
      return;
    }

    if (user) {
      fetchEstablishment();
    }
  }, [user, authLoading, isEstablishment, navigate]);

  const fetchEstablishment = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      setEstablishment(data);
    } catch (error: any) {
      toast.error("Erro ao carregar estabelecimento");
    } finally {
      setLoading(false);
    }
  };

  return { establishment, loading: authLoading || loading, user };
};
