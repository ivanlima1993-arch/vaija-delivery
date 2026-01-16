import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DriverLocation {
  id: string;
  driver_id: string;
  order_id: string | null;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  created_at: string;
}

interface UseDriverLocationSubscriptionOptions {
  orderId: string;
  enabled?: boolean;
}

export const useDriverLocationSubscription = ({
  orderId,
  enabled = true,
}: UseDriverLocationSubscriptionOptions) => {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestLocation = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("driver_locations")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching location:", fetchError);
      setError(fetchError.message);
      return;
    }

    if (data) {
      setLocation(data as DriverLocation);
    }
  }, [orderId]);

  useEffect(() => {
    if (!enabled || !orderId) return;

    // Fetch initial location
    fetchLatestLocation();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`driver-location-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "driver_locations",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("New location received:", payload.new);
          setLocation(payload.new as DriverLocation);
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        setIsConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR") {
          setError("Erro ao conectar ao rastreamento em tempo real");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, enabled, fetchLatestLocation]);

  return {
    location,
    isConnected,
    error,
    refetch: fetchLatestLocation,
  };
};
