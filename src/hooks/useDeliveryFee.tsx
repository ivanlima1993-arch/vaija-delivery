import { useState, useCallback } from "react";
import { useMapbox, Coordinates, DeliveryFeeResult } from "@/hooks/useMapbox";
import { supabase } from "@/integrations/supabase/client";

interface DeliveryFeeConfig {
  baseFee: number;
  feePerKm: number;
  freeUpToKm: number;
}

interface UseDeliveryFeeReturn {
  calculateFee: (
    establishmentId: string,
    deliveryCoordinates: Coordinates
  ) => Promise<DeliveryFeeResult | null>;
  isLoading: boolean;
  error: string | null;
  lastResult: DeliveryFeeResult | null;
}

const DEFAULT_CONFIG: DeliveryFeeConfig = {
  baseFee: 5, // R$ 5.00 base
  feePerKm: 2, // R$ 2.00 per km
  freeUpToKm: 2, // First 2km included in base
};

export const useDeliveryFee = (): UseDeliveryFeeReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<DeliveryFeeResult | null>(null);
  const { calculateDeliveryFee } = useMapbox();

  const calculateFee = useCallback(
    async (
      establishmentId: string,
      deliveryCoordinates: Coordinates
    ): Promise<DeliveryFeeResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch establishment coordinates
        const { data: establishment, error: estError } = await supabase
          .from("establishments")
          .select("latitude, longitude, delivery_fee")
          .eq("id", establishmentId)
          .single();

        if (estError) throw new Error("Estabelecimento não encontrado");

        // If establishment has no coordinates, use the default delivery_fee
        if (!establishment.latitude || !establishment.longitude) {
          const fallbackResult: DeliveryFeeResult = {
            distanceKm: 0,
            durationMinutes: 0,
            fee: establishment.delivery_fee || DEFAULT_CONFIG.baseFee,
            breakdown: {
              baseFee: establishment.delivery_fee || DEFAULT_CONFIG.baseFee,
              feePerKm: 0,
              freeUpToKm: 0,
              additionalKm: 0,
            },
          };
          setLastResult(fallbackResult);
          return fallbackResult;
        }

        const origin: Coordinates = {
          latitude: establishment.latitude,
          longitude: establishment.longitude,
        };

        // Calculate fee using Mapbox
        const result = await calculateDeliveryFee(
          origin,
          deliveryCoordinates,
          DEFAULT_CONFIG
        );

        setLastResult(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao calcular taxa";
        setError(message);
        console.error("Delivery fee calculation error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [calculateDeliveryFee]
  );

  return {
    calculateFee,
    isLoading,
    error,
    lastResult,
  };
};
