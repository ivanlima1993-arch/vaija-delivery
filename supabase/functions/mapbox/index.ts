import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAPBOX_ACCESS_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");

interface GeocodingResult {
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
}

interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    if (!MAPBOX_ACCESS_TOKEN) {
      throw new Error("MAPBOX_ACCESS_TOKEN not configured");
    }

    let result;

    switch (action) {
      case "get_token": {
        // Return the Mapbox token for client-side map rendering
        result = { token: MAPBOX_ACCESS_TOKEN };
        break;
      }

      case "reverse_geocode": {
        // Convert coordinates to address
        const { longitude, latitude } = params;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=pt-BR&types=address,place,neighborhood`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const context = feature.context || [];
          
          result = {
            address: feature.place_name,
            street: feature.text || "",
            neighborhood: context.find((c: any) => c.id.includes("neighborhood"))?.text || "",
            city: context.find((c: any) => c.id.includes("place"))?.text || "",
            state: context.find((c: any) => c.id.includes("region"))?.text || "",
            coordinates: {
              longitude: feature.center[0],
              latitude: feature.center[1],
            },
          };
        } else {
          result = null;
        }
        break;
      }

      case "geocode": {
        // Convert address to coordinates
        const { address } = params;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=pt-BR&country=BR&types=address,place`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          result = data.features.map((f: GeocodingResult) => ({
            address: f.place_name,
            coordinates: {
              longitude: f.center[0],
              latitude: f.center[1],
            },
          }));
        } else {
          result = [];
        }
        break;
      }

      case "calculate_route": {
        // Calculate route between two points
        const { origin, destination } = params;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?access_token=${MAPBOX_ACCESS_TOKEN}&geometries=geojson&overview=full`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          result = {
            distance: route.distance, // meters
            distanceKm: (route.distance / 1000).toFixed(2),
            duration: route.duration, // seconds
            durationMinutes: Math.ceil(route.duration / 60),
            geometry: route.geometry,
          };
        } else {
          result = null;
        }
        break;
      }

      case "calculate_delivery_fee": {
        // Calculate delivery fee based on distance
        const { origin, destination, baseFee = 5, feePerKm = 2, freeUpToKm = 2 } = params;
        
        // First get the route
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?access_token=${MAPBOX_ACCESS_TOKEN}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const distanceKm = data.routes[0].distance / 1000;
          const durationMinutes = Math.ceil(data.routes[0].duration / 60);
          
          let fee = baseFee;
          if (distanceKm > freeUpToKm) {
            fee += (distanceKm - freeUpToKm) * feePerKm;
          }
          
          result = {
            distanceKm: Number(distanceKm.toFixed(2)),
            durationMinutes,
            fee: Number(fee.toFixed(2)),
            breakdown: {
              baseFee,
              feePerKm,
              freeUpToKm,
              additionalKm: Math.max(0, Number((distanceKm - freeUpToKm).toFixed(2))),
            },
          };
        } else {
          throw new Error("Could not calculate route");
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Mapbox function error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
