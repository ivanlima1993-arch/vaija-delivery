import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodedAddress {
  address: string;
  street: string;
  neighborhood: string;
  number?: string;
  city: string;
  state: string;
  coordinates: Coordinates;
}

export interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  geometry?: object;
}

export interface DeliveryFeeResult {
  distanceKm: number;
  durationMinutes: number;
  fee: number;
  breakdown: {
    baseFee: number;
    feePerKm: number;
    freeUpToKm: number;
    additionalKm: number;
  };
}

export const useMapbox = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callMapboxFunction = useCallback(async (action: string, params: object) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("mapbox", {
        body: { action, ...params },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(
    async (coordinates: Coordinates): Promise<GeocodedAddress | null> => {
      return callMapboxFunction("reverse_geocode", {
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
      });
    },
    [callMapboxFunction]
  );

  const geocode = useCallback(
    async (address: string): Promise<Array<{ address: string; coordinates: Coordinates }>> => {
      return callMapboxFunction("geocode", { address });
    },
    [callMapboxFunction]
  );

  const calculateRoute = useCallback(
    async (origin: Coordinates, destination: Coordinates): Promise<RouteInfo | null> => {
      return callMapboxFunction("calculate_route", { origin, destination });
    },
    [callMapboxFunction]
  );

  const calculateDeliveryFee = useCallback(
    async (
      origin: Coordinates,
      destination: Coordinates,
      options?: { baseFee?: number; feePerKm?: number; freeUpToKm?: number }
    ): Promise<DeliveryFeeResult> => {
      return callMapboxFunction("calculate_delivery_fee", {
        origin,
        destination,
        ...options,
      });
    },
    [callMapboxFunction]
  );

  return {
    isLoading,
    error,
    reverseGeocode,
    geocode,
    calculateRoute,
    calculateDeliveryFee,
  };
};
