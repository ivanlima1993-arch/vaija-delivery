import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface UseOrderNotificationOptions {
  establishmentId: string | null;
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
}

export const useOrderNotification = ({
  establishmentId,
  onNewOrder,
  onOrderUpdate,
}: UseOrderNotificationOptions) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element for notification sound
  useEffect(() => {
    // Using a Web Audio API beep sound
    audioRef.current = new Audio();
    audioRef.current.volume = 0.7;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    // Create a simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create oscillator for the beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        
        osc2.frequency.value = 1000;
        osc2.type = "sine";
        
        gain2.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
      }, 200);
    } catch (error) {
      console.log("Audio notification not supported");
    }
  }, []);

  const showNotification = useCallback((order: Order) => {
    // Play sound
    playNotificationSound();
    
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
        duration: 10000,
        position: "top-center",
        className: "border-2 border-primary bg-card shadow-lg",
      }
    );

    // Try to use browser notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔔 Novo Pedido!", {
        body: `Pedido #${order.order_number} - R$ ${Number(order.total).toFixed(2)}`,
        icon: "/favicon.ico",
        requireInteraction: true,
      });
    }
  }, [playNotificationSound]);

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

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
          onOrderUpdate?.(updatedOrder);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, showNotification, onNewOrder, onOrderUpdate, requestNotificationPermission]);

  return { playNotificationSound, requestNotificationPermission };
};
