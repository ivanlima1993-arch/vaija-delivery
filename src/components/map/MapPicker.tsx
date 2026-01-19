import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Locate, MapPin, Loader2, AlertTriangle } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMapbox, GeocodedAddress, Coordinates } from "@/hooks/useMapbox";
import { toast } from "sonner";

// Mapbox public token (loaded from edge function for security)
const MAPBOX_PUBLIC_TOKEN = "pk.eyJ1IjoibG92YWJsZWRldiIsImEiOiJjbTRxNHNiZDYwMmtvMnFzOGN3bGdqdG9jIn0.example";

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

  const updateMarkerPosition = useCallback(async (lng: number, lat: number) => {
    setCurrentCoords({ latitude: lat, longitude: lng });
    
    try {
      const address = await reverseGeocode({ latitude: lat, longitude: lng });
      if (address) {
        onLocationSelect(address);
      }
    } catch (err) {
      console.error("Error reverse geocoding:", err);
    }
  }, [reverseGeocode, onLocationSelect]);

  // Check WebGL support
  const checkWebGLSupport = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Check WebGL support first
    if (!checkWebGLSupport()) {
      setMapError("Seu navegador não suporta WebGL. Tente abrir em uma nova aba ou use outro navegador.");
      return;
    }

    // For demo purposes - in production, fetch token from edge function
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || MAPBOX_PUBLIC_TOKEN;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: defaultCenter,
        zoom: 15,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Create draggable marker
      marker.current = new mapboxgl.Marker({
        draggable: true,
        color: "#f97316", // primary color
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

      map.current.on("load", () => {
        setMapLoaded(true);
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        setMapError("Erro ao carregar o mapa. Tente abrir em uma nova aba.");
      });
    } catch (err) {
      console.error("Error initializing map:", err);
      setMapError("Erro ao carregar o mapa. O WebGL pode não estar disponível neste ambiente.");
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const handleUseMyLocation = async () => {
    try {
      const position = await getCurrentPosition();
      const coords: [number, number] = [position.longitude, position.latitude];
      
      map.current?.flyTo({
        center: coords,
        zoom: 17,
      });
      
      marker.current?.setLngLat(coords);
      updateMarkerPosition(position.longitude, position.latitude);
      
      toast.success("Localização encontrada!");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
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
        <AlertTriangle className="w-12 h-12 text-warning" />
        <div className="text-center">
          <p className="font-medium text-sm mb-1">Mapa indisponível</p>
          <p className="text-xs text-muted-foreground max-w-[250px]">
            {mapError}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseMyLocation}
          disabled={isLoading}
        >
          {geoLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Locate className="w-4 h-4 mr-2" />
          )}
          Usar minha localização
        </Button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border">
      <div
        ref={mapContainer}
        style={{ height }}
        className="w-full"
      />
      
      {/* GPS Button */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute bottom-4 left-4 shadow-lg"
        onClick={handleUseMyLocation}
        disabled={isLoading || !!mapError}
      >
        {geoLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Locate className="w-4 h-4 mr-2" />
        )}
        Usar minha localização
      </Button>

      {/* Loading overlay */}
      {mapboxLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Buscando endereço...</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default MapPicker;
