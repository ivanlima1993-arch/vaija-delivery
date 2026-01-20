import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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

export const useGlobalOrderNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const activeOrdersRef = useRef<Map<string, OrderStatus>>(new Map());
  const isInitializedRef = useRef(false);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 587.33;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        
        osc2.frequency.value = 880;
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

  const showNotification = useCallback((order: Order) => {
    const message = statusMessages[order.status];
    if (!message) return;

    playNotificationSound();
    
    const toastVariant = order.status === "cancelled" ? toast.error : toast.success;
    
    toastVariant(
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => navigate(`/pedido/${order.id}`)}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <span className="text-lg">{message.icon}</span>
        </div>
        <div>
          <p className="font-bold text-base">{message.title}</p>
          <p className="text-sm text-muted-foreground">
            Pedido #{order.order_number} • Clique para ver
          </p>
        </div>
      </div>,
      {
        duration: 10000,
        position: "top-center",
        className: "border-2 border-primary bg-card shadow-lg cursor-pointer",
      }
    );

    // Browser push notification
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(message.title, {
        body: `${message.body}\nPedido #${order.order_number}`,
        icon: "/favicon.ico",
        tag: `order-${order.id}-${order.status}`,
        requireInteraction: order.status === "out_for_delivery",
      });

      notification.onclick = () => {
        window.focus();
        navigate(`/pedido/${order.id}`);
        notification.close();
      };
    }
  }, [playNotificationSound, navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch active orders on mount to initialize tracking
    const fetchActiveOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status")
        .eq("customer_id", user.id)
        .not("status", "in", '("delivered","cancelled")');

      if (data) {
        data.forEach((order) => {
          activeOrdersRef.current.set(order.id, order.status);
        });
      }
      isInitializedRef.current = true;
    };

    fetchActiveOrders();

    // Subscribe to all orders for this customer
    const channel = supabase
      .channel(`global-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          const previousStatus = activeOrdersRef.current.get(updatedOrder.id);
          
          // Only notify if status changed and we're initialized
          if (isInitializedRef.current && previousStatus && previousStatus !== updatedOrder.status) {
            showNotification(updatedOrder);
          }
          
          // Update tracking
          if (updatedOrder.status === "delivered" || updatedOrder.status === "cancelled") {
            activeOrdersRef.current.delete(updatedOrder.id);
          } else {
            activeOrdersRef.current.set(updatedOrder.id, updatedOrder.status);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          activeOrdersRef.current.set(newOrder.id, newOrder.status);
        }
      )
      .subscribe();

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showNotification]);

  return null;
};
