import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

interface StatusMessage {
  title: string;
  body: string;
  icon: string;
}

const statusMessages: Record<OrderStatus, StatusMessage> = {
  pending: {
    title: "Pedido Recebido",
    body: "Seu pedido foi recebido e está aguardando confirmação.",
    icon: "⏳",
  },
  confirmed: {
    title: "Pedido Confirmado! ✅",
    body: "Ótimo! O estabelecimento confirmou seu pedido.",
    icon: "✅",
  },
  preparing: {
    title: "Em Preparo! 👨‍🍳",
    body: "Seu pedido está sendo preparado com carinho.",
    icon: "👨‍🍳",
  },
  ready: {
    title: "Pedido Pronto! 📦",
    body: "Seu pedido está pronto e aguardando o entregador.",
    icon: "📦",
  },
  out_for_delivery: {
    title: "Saiu para Entrega! 🛵",
    body: "Seu pedido está a caminho! Acompanhe no mapa.",
    icon: "🛵",
  },
  delivered: {
    title: "Entregue! 🎉",
    body: "Seu pedido foi entregue. Bom apetite!",
    icon: "🎉",
  },
  cancelled: {
    title: "Pedido Cancelado",
    body: "Infelizmente seu pedido foi cancelado.",
    icon: "❌",
  },
};

interface UseCustomerOrderNotificationOptions {
  orderId: string | null;
  onStatusChange?: (order: Order, previousStatus: OrderStatus | null) => void;
}

export const useCustomerOrderNotification = ({
  orderId,
  onStatusChange,
}: UseCustomerOrderNotificationOptions) => {
  const previousStatusRef = useRef<OrderStatus | null>(null);
  const hasInitializedRef = useRef(false);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Pleasant notification sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 587.33; // D5
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // Second note (higher)
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        
        osc2.frequency.value = 880; // A5
        osc2.type = "sine";
        
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.4);
      }, 150);
    } catch (error) {
      console.log("Audio notification not supported");
    }
  }, []);

  const showNotification = useCallback((order: Order, isInitial: boolean = false) => {
    const message = statusMessages[order.status];
    if (!message) return;

    // Don't show notification on initial load
    if (isInitial) {
      previousStatusRef.current = order.status;
      return;
    }

    // Play sound
    playNotificationSound();
    
    // Show toast with custom styling based on status
    const toastVariant = order.status === "cancelled" ? toast.error : toast.success;
    
    toastVariant(
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <span className="text-lg">{message.icon}</span>
        </div>
        <div>
          <p className="font-bold text-base">{message.title}</p>
          <p className="text-sm text-muted-foreground">
            Pedido #{order.order_number}
          </p>
        </div>
      </div>,
      {
        duration: 8000,
        position: "top-center",
        className: "border-2 border-primary bg-card shadow-lg",
      }
    );

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(message.title, {
        body: `${message.body}\nPedido #${order.order_number}`,
        icon: "/favicon.ico",
        tag: `order-${order.id}-${order.status}`,
        requireInteraction: order.status === "out_for_delivery",
      });
    }
  }, [playNotificationSound]);

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Notificações ativadas! Você será avisado sobre atualizações do pedido.");
      }
    }
  }, []);

  useEffect(() => {
    if (!orderId) return;

    // Request permission on mount
    requestNotificationPermission();

    const channel = supabase
      .channel(`customer-order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          const oldOrder = payload.old as Partial<Order>;
          
          // Only notify if status actually changed
          if (oldOrder.status !== updatedOrder.status) {
            showNotification(updatedOrder, false);
            onStatusChange?.(updatedOrder, previousStatusRef.current);
            previousStatusRef.current = updatedOrder.status;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, showNotification, onStatusChange, requestNotificationPermission]);

  // Set initial status without notification
  const initializeStatus = useCallback((status: OrderStatus) => {
    if (!hasInitializedRef.current) {
      previousStatusRef.current = status;
      hasInitializedRef.current = true;
    }
  }, []);

  return { 
    requestNotificationPermission, 
    playNotificationSound,
    initializeStatus,
  };
};
