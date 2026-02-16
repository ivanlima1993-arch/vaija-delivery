import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Locate, Loader2, AlertTriangle } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMapbox, GeocodedAddress, Coordinates } from "@/hooks/useMapbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MapPickerProps {
  initialCoordinates?: Coordinates;
  onLocationSelect: (address: GeocodedAddress) => void;
  height?: string;
}

const MapPicker = ({ initialCoordinates, onLocationSelect, height = "300px" }: MapPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<Coordinates | null>(initialCoordinates || null);

  const { getCurrentPosition, isLoading: geoLoading } = useGeolocation();
  const { reverseGeocode, isLoading: mapboxLoading } = useMapbox();

  const isLoading = geoLoading || mapboxLoading;

  // Default to Brazil center
  const defaultCenter: [number, number] = initialCoordinates
    ? [initialCoordinates.longitude, initialCoordinates.latitude]
    : [-49.2648, -25.4284]; // Curitiba as default

  const updateMarkerPosition = useCallback(
    async (lng: number, lat: number) => {
      setCurrentCoords({ latitude: lat, longitude: lng });

      try {
        const address = await reverseGeocode({ latitude: lat, longitude: lng });
        if (address) {
          onLocationSelect(address);
        } else {
          console.warn("Nenhum endereço encontrado para estas coordenadas.");
          toast.error("Não conseguimos encontrar o endereço exato para este local.");
        }
      } catch (err) {
        console.error("Error reverse geocoding:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro na busca de endereço";
        toast.error(`Falha ao buscar endereço: ${errorMessage}`);
      }
    },
    [reverseGeocode, onLocationSelect]
  );

  // Check WebGL support
  const checkWebGLSupport = useCallback(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    } catch {
      return false;
    }
  }, []);

  const fetchMapboxToken = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("mapbox", {
      body: { action: "get_token" },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Falha ao obter token do mapa");

    const token = data.data?.token;
    if (!token) throw new Error("Token do mapa não retornado");

    return token as string;
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    let cancelled = false;

    const init = async () => {
      // Small delay to ensure container is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      if (cancelled || !mapContainer.current) return;

      // Check WebGL support first
      if (!checkWebGLSupport()) {
        setMapError("Seu navegador não suporta WebGL. Tente abrir em uma nova aba ou use outro navegador.");
        return;
      }

      try {
        const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || (await fetchMapboxToken());
        if (cancelled) return;

        if (!token || token.trim().length < 10) {
          throw new Error("Token do Mapbox inválido ou muito curto.");
        }

        mapboxgl.accessToken = token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: defaultCenter,
          zoom: 15,
        });

        // Ensure map is resized correctly
        map.current.on("load", () => {
          if (cancelled) return;
          setMapLoaded(true);
          map.current?.resize();
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Create draggable marker
        marker.current = new mapboxgl.Marker({
          draggable: true,
          color: "hsl(var(--primary))",
        })
          .setLngLat(defaultCenter)
          .addTo(map.current);

        // Handle marker drag
        marker.current.on("dragend", () => {
          const lngLat = marker.current!.getLngLat();
          updateMarkerPosition(lngLat.lng, lngLat.lat);
        });

        // Handle map click
        map.current.on("click", (e) => {
          const { lng, lat } = e.lngLat;
          marker.current?.setLngLat([lng, lat]);
          updateMarkerPosition(lng, lat);
        });

        map.current.on("error", (e) => {
          console.error("Mapbox GL Error:", e);
          if (!mapLoaded) {
            setMapError("Erro ao carregar o mapa. Verifique se a sua chave de API (Mapbox Token) está ativa e configurada corretamente.");
          }
        });
      } catch (err) {
        console.error("Error initializing map:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        if (errorMessage.includes("MAPBOX_ACCESS_TOKEN not configured")) {
          setMapError("Configuração pendente: A variável MAPBOX_ACCESS_TOKEN não foi configurada nas Secrets do Supabase.");
        } else {
          setMapError(`Falha ao inicializar o mapa: ${errorMessage}`);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [checkWebGLSupport, defaultCenter, fetchMapboxToken, updateMarkerPosition]);

  const handleUseMyLocation = async () => {
    try {
      const position = await getCurrentPosition();
      const coords: [number, number] = [position.longitude, position.latitude];

      if (map.current) {
        map.current.flyTo({
          center: coords,
          zoom: 17,
        });
      }

      marker.current?.setLngLat(coords);

      // Await the address lookup
      toast.info("Buscando seu endereço...");
      await updateMarkerPosition(position.longitude, position.latitude);

      toast.success("Localização e endereço encontrados!");
    } catch (err) {
      console.error("Erro ao obter localização:", err);
      if (err instanceof Error) {
        toast.error(`Erro: ${err.message}`);
      } else {
        toast.error("Erro ao obter localização atual.");
      }
    }
  };

  // Show error state with fallback UI
  if (mapError) {
    return (
      <div
        className="relative rounded-xl overflow-hidden border border-border bg-muted flex flex-col items-center justify-center gap-4 p-6"
        style={{ height }}
      >
        <AlertTriangle className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium text-sm mb-1">Mapa indisponível</p>
          <p className="text-xs text-muted-foreground max-w-[250px]">{mapError}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocation} disabled={isLoading}>
          {geoLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Locate className="w-4 h-4 mr-2" />}
          Usar minha localização
        </Button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border">
      <div ref={mapContainer} style={{ height }} className="w-full" />

      {/* GPS Button */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute bottom-4 left-4 shadow-lg"
        onClick={handleUseMyLocation}
        disabled={isLoading || !!mapError}
      >
        {geoLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Locate className="w-4 h-4 mr-2" />}
        Usar minha localização
      </Button>

      {/* Loading overlay: reverse geocoding */}
      {mapboxLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Buscando endereço...</span>
          </div>
        </div>
      )}

      {/* Map loading state */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default MapPicker;

