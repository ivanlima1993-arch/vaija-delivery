import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface EstablishmentInfo {
  name: string;
  address: string | null;
}

export const useDriverOrderNotifications = () => {
  const { user, isDriver } = useAuth();
  const navigate = useNavigate();
  const knownOrdersRef = useRef<Set<string>>(new Set());
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

      // Upbeat notification sound for new orders
      // First tone - ascending
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

      // Second tone
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

      // Third tone - higher
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      osc3.frequency.value = 783.99; // G5
      osc3.type = "sine";
      gain3.gain.setValueAtTime(0.4, audioContext.currentTime + 0.2);
      gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      osc3.start(audioContext.currentTime + 0.2);
      osc3.stop(audioContext.currentTime + 0.4);

      // Final tone - highest
      const osc4 = audioContext.createOscillator();
      const gain4 = audioContext.createGain();
      osc4.connect(gain4);
      gain4.connect(audioContext.destination);
      osc4.frequency.value = 1046.5; // C6
      osc4.type = "sine";
      gain4.gain.setValueAtTime(0.5, audioContext.currentTime + 0.3);
      gain4.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      osc4.start(audioContext.currentTime + 0.3);
      osc4.stop(audioContext.currentTime + 0.6);
    } catch (error) {
      console.log("Audio notification not supported");
    }
  }, []);

  const showNotification = useCallback(
    (order: Order, establishment?: EstablishmentInfo) => {
      playNotificationSound();

      const establishmentName = establishment?.name || "Estabelecimento";
      const deliveryFee = Number(order.delivery_fee).toFixed(2);

      toast.success(
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/entregador/disponiveis")}
        >
          <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-xl">🛵</span>
          </div>
          <div>
            <p className="font-bold text-base text-green-700 dark:text-green-300">
              Novo Pedido Disponível!
            </p>
            <p className="text-sm text-muted-foreground">
              {establishmentName} • R$ {deliveryFee}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clique para ver detalhes
            </p>
          </div>
        </div>,
        {
          duration: 15000,
          position: "top-center",
          className: "border-2 border-green-500 bg-card shadow-xl cursor-pointer",
        }
      );

      // Browser push notification
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification("🛵 Novo Pedido Disponível!", {
          body: `${establishmentName}\nTaxa de entrega: R$ ${deliveryFee}`,
          icon: "/pwa-192x192.png",
          tag: `driver-order-${order.id}`,
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          navigate("/entregador/disponiveis");
          notification.close();
        };
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
    if (!user || !isDriver) return;

    // Fetch existing ready orders to initialize tracking
    const fetchExistingOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id")
        .eq("status", "ready")
        .is("driver_id", null);

      if (data) {
        data.forEach((order) => {
          knownOrdersRef.current.add(order.id);
        });
      }
      isInitializedRef.current = true;
    };

    fetchExistingOrders();

    // Request notification permission
    requestNotificationPermission();

    // Subscribe to new ready orders
    const channel = supabase
      .channel("driver-available-orders-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          const order = payload.new as Order;
          const oldOrder = payload.old as Partial<Order>;

          // Only notify when order becomes ready and has no driver
          if (
            isInitializedRef.current &&
            order.status === "ready" &&
            order.driver_id === null &&
            oldOrder.status !== "ready" &&
            !knownOrdersRef.current.has(order.id)
          ) {
            // Fetch establishment info
            const { data: establishment } = await supabase
              .from("establishments")
              .select("name, address")
              .eq("id", order.establishment_id)
              .maybeSingle();

            showNotification(order, establishment || undefined);
            knownOrdersRef.current.add(order.id);
          }

          // Remove from tracking if order is no longer available
          if (order.status !== "ready" || order.driver_id !== null) {
            knownOrdersRef.current.delete(order.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isDriver, showNotification, requestNotificationPermission]);

  return {
    requestNotificationPermission,
    playNotificationSound,
  };
};
