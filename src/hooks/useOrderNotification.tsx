import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface UseOrderNotificationOptions {
  establishmentId: string | null;
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
  soundEnabled?: boolean;
}

export const useOrderNotification = ({
  establishmentId,
  onNewOrder,
  onOrderUpdate,
  soundEnabled = true,
}: UseOrderNotificationOptions) => {
  const navigate = useNavigate();
  const [pendingOrdersWithSound, setPendingOrdersWithSound] = useState<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const playBeepSequence = useCallback(() => {
    if (!audioContextRef.current || isPlayingRef.current) return;

    isPlayingRef.current = true;

    try {
      const audioContext = audioContextRef.current;

      // Ensure audio context is running
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // First beep - higher pitch
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();

      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);

      oscillator1.frequency.value = 880;
      oscillator1.type = "sine";

      gainNode1.gain.setValueAtTime(0.6, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.3);

      // Second beep - even higher
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);

      oscillator2.frequency.value = 1100;
      oscillator2.type = "sine";

      gainNode2.gain.setValueAtTime(0.6, audioContext.currentTime + 0.15);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.45);

      oscillator2.start(audioContext.currentTime + 0.15);
      oscillator2.stop(audioContext.currentTime + 0.45);

      // Third beep - highest
      const oscillator3 = audioContext.createOscillator();
      const gainNode3 = audioContext.createGain();

      oscillator3.connect(gainNode3);
      gainNode3.connect(audioContext.destination);

      oscillator3.frequency.value = 1320;
      oscillator3.type = "sine";

      gainNode3.gain.setValueAtTime(0.6, audioContext.currentTime + 0.3);
      gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

      oscillator3.start(audioContext.currentTime + 0.3);
      oscillator3.stop(audioContext.currentTime + 0.6);

      setTimeout(() => {
        isPlayingRef.current = false;
      }, 700);
    } catch (error) {
      console.log("Audio notification not supported");
      isPlayingRef.current = false;
    }
  }, []);

  // Play persistent sound for pending orders
  useEffect(() => {
    // Clear any existing interval to start fresh
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (pendingOrdersWithSound.size > 0 && soundEnabled) {
      // Play immediately
      playBeepSequence();

      // Start interval to repeat every 3 seconds
      intervalRef.current = setInterval(() => {
        playBeepSequence();
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pendingOrdersWithSound.size, soundEnabled, playBeepSequence]);

  // Stop sound for a specific order (when confirmed)
  const stopSoundForOrder = useCallback((orderId: string) => {
    setPendingOrdersWithSound(prev => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
  }, []);

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    setPendingOrdersWithSound(new Set());
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Add order to sound list
  const addOrderToSoundList = useCallback((orderId: string) => {
    setPendingOrdersWithSound(prev => {
      const newSet = new Set(prev);
      newSet.add(orderId);
      return newSet;
    });
  }, []);

  const showNotification = useCallback((order: Order) => {
    // Add order to persistent sound list
    if (order.status === "pending") {
      addOrderToSoundList(order.id);
    }

    const orderNumber = order.order_number || '---';
    const orderTotal = Number(order.total || 0).toFixed(2);

    // Show toast with custom styling
    toast.success(
      <div
        className="flex items-center gap-4 w-full cursor-pointer p-1"
        onClick={() => {
          navigate("/estabelecimento/pedidos");
          toast.dismiss();
        }}
      >
        <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary opacity-20 animate-ping rounded-full"></div>
          <span className="text-primary text-xl relative z-10">🔔</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-extrabold text-base text-primary uppercase tracking-tight">Novo Pedido Recebido!</p>
            <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full font-bold">AGORA</span>
          </div>
          <p className="text-sm font-medium mt-0.5">
            Ref: <span className="font-bold">#{orderNumber}</span> • Total: <span className="text-green-600 font-bold">R$ {orderTotal}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 italic">
            Clique para aceitar ou recusar este pedido
          </p>
        </div>
      </div>,
      {
        duration: Infinity,
        position: "top-center",
        className: "border-2 border-primary bg-card/95 backdrop-blur-sm shadow-2xl rounded-2xl p-4 min-w-[340px] hover:scale-[1.02] transition-transform",
      }
    );

    // Use ServiceWorker for notifications to avoid "Illegal constructor" on mobile
    if ("serviceWorker" in navigator && "Notification" in window && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("🔔 Novo Pedido!", {
          body: `Pedido #${orderNumber} - R$ ${orderTotal}`,
          icon: "/pwa-192x192.png",
          requireInteraction: true,
          tag: `order-${order.id}`,
          data: {
            url: window.location.origin + window.location.pathname + "#/estabelecimento/pedidos",
          },
        });
      }).catch(err => {
        console.error("ServiceWorker notification failed:", err);
        // Fallback to manual constructor if possible
        try {
          new Notification("🔔 Novo Pedido!", {
            body: `Pedido #${orderNumber} - R$ ${orderTotal}`,
            icon: "/pwa-192x192.png",
            requireInteraction: true,
            tag: `order-${order.id}`,
          });
        } catch (e) {
          console.error("Manual notification fallback failed:", e);
        }
      });
    }
  }, [addOrderToSoundList]);

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  // Fetch initial pending orders to resume sound
  useEffect(() => {
    if (!establishmentId) return;

    const fetchPendingOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("establishment_id", establishmentId)
        .eq("status", "pending");

      if (data) {
        // Filter: offline payments OR paid online payments
        const visibleOrders = data.filter(o => {
          const isOnline = o.payment_method === 'pix' || o.payment_method === 'credit_card';
          const isPaid = o.payment_status === 'paid';
          return !isOnline || isPaid;
        });

        if (visibleOrders.length > 0) {
          setPendingOrdersWithSound(new Set(visibleOrders.map(o => o.id)));
        }
      }
    };

    fetchPendingOrders();
  }, [establishmentId]);

  useEffect(() => {
    if (!establishmentId) return;

    // Request notification permission on mount
    requestNotificationPermission();

    const channel = supabase
      .channel(`orders-notification-${establishmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `establishment_id=eq.${establishmentId}`,
        },
        (payload) => {
          if (!payload?.new) return;
          const newOrder = payload.new as Order;
          const isOnline = newOrder.payment_method === 'pix' || newOrder.payment_method === 'credit_card';
          const isPaid = newOrder.payment_status === 'paid';

          if (!isOnline || isPaid) {
            showNotification(newOrder);
            onNewOrder?.(newOrder);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `establishment_id=eq.${establishmentId}`,
        },
        (payload) => {
          if (!payload?.new) return;
          const initialOrder = payload.new as Order;
          const oldOrder = (payload.old || {}) as any;

          const isOnline = initialOrder.payment_method === 'pix' || initialOrder.payment_method === 'credit_card';
          const wasPaid = oldOrder.payment_status === 'paid';
          const isPaid = initialOrder.payment_status === 'paid';

          // If it was online and just got paid, and is still pending, notify as new
          if (isOnline && !wasPaid && isPaid && initialOrder.status === 'pending') {
            // Fetch full order data to ensure we have all fields for the UI
            supabase
              .from("orders")
              .select("*")
              .eq("id", initialOrder.id)
              .maybeSingle()
              .then(({ data: fullOrder }) => {
                if (fullOrder) {
                  const updatedOrder = fullOrder as Order;
                  showNotification(updatedOrder);
                  onNewOrder?.(updatedOrder);
                }
              });
          } else {
            // Stop sound when order is no longer pending
            if (initialOrder.status && initialOrder.status !== "pending") {
              stopSoundForOrder(initialOrder.id);
            }
            onOrderUpdate?.(initialOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, showNotification, onNewOrder, onOrderUpdate, requestNotificationPermission, stopSoundForOrder]);

  return {
    playNotificationSound: playBeepSequence,
    requestNotificationPermission,
    stopSoundForOrder,
    stopAllSounds,
    pendingOrdersWithSound: Array.from(pendingOrdersWithSound),
    hasPendingSounds: pendingOrdersWithSound.size > 0,
  };
};
