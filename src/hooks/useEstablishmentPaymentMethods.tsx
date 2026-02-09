import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentMethod {
  method_key: string;
  method_name: string;
  description: string | null;
  is_enabled: boolean;
}

export const useEstablishmentPaymentMethods = (establishmentId: string | null) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!establishmentId) {
      setMethods([]);
      setLoading(false);
      return;
    }

    const fetchMethods = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("establishment_payment_methods")
        .select("method_key, method_name, description, is_enabled")
        .eq("establishment_id", establishmentId)
        .eq("is_enabled", true);

      setMethods(data || []);
      setLoading(false);
    };

    fetchMethods();
  }, [establishmentId]);

  return { methods, loading };
};
