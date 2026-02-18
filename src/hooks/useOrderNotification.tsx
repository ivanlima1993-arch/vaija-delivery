import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
    if (pendingOrdersWithSound.size > 0 && soundEnabled) {
      // Play immediately
      playBeepSequence();

      // Start interval to repeat every 3 seconds
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          if (pendingOrdersWithSound.size > 0 && soundEnabled) {
            playBeepSequence();
          }
        }, 3000);
      }
    } else {
      // Stop interval when no pending orders
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current && pendingOrdersWithSound.size === 0) {
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

    // Show toast with custom styling
    toast.success(
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white text-lg">🔔</span>
        </div>
        <div>
          <p className="font-bold text-base">Novo Pedido!</p>
          <p className="text-sm text-muted-foreground">
            Pedido #{order.order_number} - R$ {Number(order.total).toFixed(2)}
          </p>
        </div>
      </div>,
      {
        duration: Infinity, // Keep until dismissed
        position: "top-center",
        className: "border-2 border-primary bg-card shadow-lg",
        action: {
          label: "Ver",
          onClick: () => { },
        },
      }
    );

    // Try to use browser notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔔 Novo Pedido!", {
        body: `Pedido #${order.order_number} - R$ ${Number(order.total).toFixed(2)}`,
        icon: "/pwa-192x192.png",
        requireInteraction: true,
        tag: `order-${order.id}`,
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
        .select("id")
        .eq("establishment_id", establishmentId)
        .eq("status", "pending");

      if (data && data.length > 0) {
        setPendingOrdersWithSound(new Set(data.map(o => o.id)));
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
          const newOrder = payload.new as Order;
          showNotification(newOrder);
          onNewOrder?.(newOrder);
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
          const updatedOrder = payload.new as Order;

          // Stop sound when order is no longer pending
          if (updatedOrder.status !== "pending") {
            stopSoundForOrder(updatedOrder.id);
          }

          onOrderUpdate?.(updatedOrder);
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
