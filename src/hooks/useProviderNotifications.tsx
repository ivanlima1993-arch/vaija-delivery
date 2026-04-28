import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const useProviderNotifications = (providerId?: string) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const knownRequestsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      // Resume if suspended
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.frequency.value = 523.25; // C5
      osc1.type = "sine";
      gain1.gain.setValueAtTime(0.4, audioContext.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      osc1.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.15);

      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 659.25; // E5
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.4, audioContext.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      osc2.start(audioContext.currentTime + 0.1);
      osc2.stop(audioContext.currentTime + 0.25);

    } catch (error) {
      console.log("Audio notification not supported");
    }
  }, []);

  const showNotification = useCallback(
    (request: any) => {
      playNotificationSound();

      toast.success(
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/profissional/dashboard")}
        >
          <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-xl">🔔</span>
          </div>
          <div>
            <p className="font-bold text-base text-primary">
              Nova Solicitação de Serviço!
            </p>
            <p className="text-sm text-muted-foreground">
              {request.customer_name || "Novo Cliente"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clique para ver detalhes
            </p>
          </div>
        </div>,
        {
          duration: 15000,
          position: "top-center",
          className: "border-2 border-primary bg-card shadow-xl cursor-pointer",
        }
      );

      // Use ServiceWorker for notifications to avoid "Illegal constructor" on mobile
      if ("serviceWorker" in navigator && "Notification" in window && Notification.permission === "granted") {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification("🔔 Nova Solicitação!", {
            body: `Você recebeu uma nova solicitação de ${request.customer_name || "um cliente"}.`,
            icon: "/pwa-192x192.png",
            tag: `provider-request-${request.id}`,
            requireInteraction: true,
            data: {
              url: window.location.origin + window.location.pathname + "#/profissional/dashboard",
            },
          });
        }).catch(err => {
          console.error("ServiceWorker notification failed:", err);
          try {
            const notification = new Notification("🔔 Nova Solicitação!", {
              body: `Você recebeu uma nova solicitação de ${request.customer_name || "um cliente"}.`,
              icon: "/pwa-192x192.png",
              tag: `provider-request-${request.id}`,
              requireInteraction: true,
            });

            notification.onclick = () => {
              window.focus();
              navigate("/profissional/dashboard");
              notification.close();
            };
          } catch (e) {
            console.error("Manual notification fallback failed:", e);
          }
        });
      }
    },
    [playNotificationSound, navigate]
  );

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  useEffect(() => {
    if (!user || !providerId) return;

    // Fetch existing pending requests to initialize tracking
    const fetchExistingRequests = async () => {
      const { data } = await supabase
        .from("service_requests")
        .select("id")
        .eq("provider_id", providerId)
        .eq("status", "pending");

      if (data) {
        data.forEach((req) => {
          knownRequestsRef.current.add(req.id);
        });
      }
      isInitializedRef.current = true;
    };

    fetchExistingRequests();

    // Request notification permission
    requestNotificationPermission();

    // Subscribe to new requests
    const channel = supabase
      .channel(`provider-requests-${providerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "service_requests",
          filter: `provider_id=eq.${providerId}`,
        },
        async (payload) => {
          if (!payload?.new) return;
          const req = payload.new as any;

          if (isInitializedRef.current && req.status === "pending" && !knownRequestsRef.current.has(req.id)) {
            
            // Try to get customer name
            let customerName = req.customer_name;
            if (!customerName && req.customer_id) {
               const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("user_id", req.customer_id)
                .maybeSingle();
                
               if (profile?.full_name) {
                 customerName = profile.full_name;
               }
            }

            showNotification({...req, customer_name: customerName});
            knownRequestsRef.current.add(req.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, providerId, showNotification, requestNotificationPermission]);

  return {
    requestNotificationPermission,
    playNotificationSound,
  };
};
