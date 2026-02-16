import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useDriverLocationSubscription } from "@/hooks/useDriverLocationSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Bike, MapPin, Store, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DriverTrackingMapProps {
  orderId: string;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  establishmentLatitude?: number | null;
  establishmentLongitude?: number | null;
  className?: string;
}

const DriverTrackingMap = ({
  orderId,
  deliveryLatitude,
  deliveryLongitude,
  establishmentLatitude,
  establishmentLongitude,
  className = "",
}: DriverTrackingMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const { location, isConnected, error: subscriptionError } = useDriverLocationSubscription({
    orderId,
    enabled: !!mapboxToken,
  });

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("mapbox", {
          body: { action: "get_token" },
        });

        if (error) throw error;
        if (data?.success && data?.data?.token) {
          setMapboxToken(data.data.token);
        } else {
          throw new Error(data?.error || "Token não retornado");
        }
      } catch (err) {
        console.error("Error fetching Mapbox token:", err);
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        if (message.includes("MAPBOX_ACCESS_TOKEN not configured")) {
          setMapError("Configuração pendente: MAPBOX_ACCESS_TOKEN não configurado no Supabase.");
        } else {
          setMapError(`Falha ao obter token do mapa: ${message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = mapboxToken;

      // Default center (use delivery location if available)
      const center: [number, number] = [
        deliveryLongitude || -46.6333,
        deliveryLatitude || -23.5505,
      ];

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom: 14,
      });

      map.current.on("load", () => {
        map.current?.resize();
      });

      map.current.on("error", (e) => {
        console.error("Mapbox GL Error:", e);
        setMapError("Erro ao carregar o mapa. Verifique sua chave de acesso.");
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add delivery marker if coordinates available
      if (deliveryLatitude && deliveryLongitude) {
        const deliveryEl = document.createElement("div");
        deliveryEl.innerHTML = `
          <div class="flex items-center justify-center w-10 h-10 bg-primary rounded-full shadow-lg border-2 border-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `;

        new mapboxgl.Marker({ element: deliveryEl })
          .setLngLat([deliveryLongitude, deliveryLatitude])
          .addTo(map.current);
      }

      // Add establishment marker if coordinates available
      if (establishmentLatitude && establishmentLongitude) {
        const storeEl = document.createElement("div");
        storeEl.innerHTML = `
          <div class="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-full shadow-lg border-2 border-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </div>
        `;

        new mapboxgl.Marker({ element: storeEl })
          .setLngLat([establishmentLongitude, establishmentLatitude])
          .addTo(map.current);
      }
    } catch (err) {
      console.error("Error initializing DriverTrackingMap:", err);
      setMapError("Erro ao inicializar o mapa.");
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, deliveryLatitude, deliveryLongitude, establishmentLatitude, establishmentLongitude]);

  // Update driver marker when location changes
  useEffect(() => {
    if (!map.current || !location) return;

    const { latitude, longitude } = location;

    if (!driverMarker.current) {
      // Create driver marker
      const driverEl = document.createElement("div");
      driverEl.innerHTML = `
        <div class="relative">
          <div class="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full shadow-lg border-3 border-white animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <circle cx="18.5" cy="17.5" r="3.5"/>
              <circle cx="5.5" cy="17.5" r="3.5"/>
              <circle cx="15" cy="5" r="1"/>
              <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-green-500"></div>
        </div>
      `;

      driverMarker.current = new mapboxgl.Marker({ element: driverEl })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      // Center map on driver
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 1000,
      });
    } else {
      // Update marker position with animation
      driverMarker.current.setLngLat([longitude, latitude]);
    }
  }, [location]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-xl ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (mapError || !mapboxToken) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted rounded-xl p-4 text-center ${className}`}>
        <p className="text-sm font-medium text-destructive mb-1">Mapa não carregou</p>
        <p className="text-xs text-muted-foreground max-w-[200px]">{mapError || "Token do mapa não disponível"}</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Status badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge
          variant={isConnected ? "default" : "secondary"}
          className={isConnected ? "bg-green-500 text-white" : ""}
        >
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-white animate-pulse" : "bg-gray-400"}`} />
          {isConnected ? "Ao vivo" : "Conectando..."}
        </Badge>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full" />
          <span>Entregador</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded-full" />
          <span>Destino</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full" />
          <span>Loja</span>
        </div>
      </div>

      {error && (
        <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default DriverTrackingMap;
