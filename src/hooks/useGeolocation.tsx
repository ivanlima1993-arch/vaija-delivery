import { useState, useCallback } from "react";

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  isLoading: boolean;
  getCurrentPosition: () => Promise<GeolocationPosition>;
  isSupported: boolean;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        const err: GeolocationError = {
          code: 0,
          message: "Geolocalização não é suportada neste navegador",
        };
        setError(err);
        reject(err);
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPosition: GeolocationPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(newPosition);
          setIsLoading(false);
          resolve(newPosition);
        },
        (err) => {
          let message: string;
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = "Permissão de localização negada. Por favor, habilite a localização nas configurações do navegador.";
              break;
            case err.POSITION_UNAVAILABLE:
              message = "Localização indisponível. Verifique sua conexão GPS.";
              break;
            case err.TIMEOUT:
              message = "Tempo esgotado ao buscar localização. Tente novamente.";
              break;
            default:
              message = "Erro desconhecido ao obter localização.";
          }
          const geolocationError: GeolocationError = {
            code: err.code,
            message,
          };
          setError(geolocationError);
          setIsLoading(false);
          reject(geolocationError);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [isSupported]);

  return {
    position,
    error,
    isLoading,
    getCurrentPosition,
    isSupported,
  };
};
