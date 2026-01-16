import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "./useGeolocation";
import { toast } from "sonner";

interface DriverLocationTrackerOptions {
  orderId: string;
  driverId: string;
  updateIntervalMs?: number;
  onError?: (error: string) => void;
}

export const useDriverLocationTracker = ({
  orderId,
  driverId,
  updateIntervalMs = 5000,
  onError,
}: DriverLocationTrackerOptions) => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { getCurrentPosition, isSupported } = useGeolocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendLocation = useCallback(async () => {
    try {
      const position = await getCurrentPosition();
      
      const { error } = await supabase.from("driver_locations").insert({
        driver_id: driverId,
        order_id: orderId,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
      });

      if (error) throw error;
      
      setLastUpdate(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar localização";
      console.error("Location tracking error:", message);
      onError?.(message);
    }
  }, [getCurrentPosition, driverId, orderId, onError]);

  const startTracking = useCallback(async () => {
    if (!isSupported) {
      toast.error("Geolocalização não suportada neste navegador");
      return;
    }

    setIsTracking(true);
    
    // Send initial location
    await sendLocation();
    
    // Set up interval for updates
    intervalRef.current = setInterval(sendLocation, updateIntervalMs);
    
    toast.success("Rastreamento ativado");
  }, [isSupported, sendLocation, updateIntervalMs]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    lastUpdate,
    startTracking,
    stopTracking,
    isSupported,
  };
};
