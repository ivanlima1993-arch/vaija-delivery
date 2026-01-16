import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DriverTrackingMap from "@/components/tracking/DriverTrackingMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  Store,
  Bike,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Loader2,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type Establishment = Database["public"]["Tables"]["establishments"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: "Aguardando confirmação", color: "bg-yellow-500", icon: Clock },
  confirmed: { label: "Pedido confirmado", color: "bg-blue-500", icon: CheckCircle },
  preparing: { label: "Em preparo", color: "bg-orange-500", icon: Package },
  ready: { label: "Pronto para entrega", color: "bg-purple-500", icon: Store },
  out_for_delivery: { label: "Saiu para entrega", color: "bg-green-500", icon: Bike },
  delivered: { label: "Entregue", color: "bg-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: Package },
};

const statusOrder: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (orderId && user) {
      fetchOrder();
      subscribeToOrder();
    }
  }, [orderId, user, authLoading]);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setOrder(orderData);

      // Fetch order items
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      setOrderItems(items || []);

      // Fetch establishment
      if (orderData.establishment_id) {
        const { data: estab } = await supabase
          .from("establishments")
          .select("*")
          .eq("id", orderData.establishment_id)
          .single();
        setEstablishment(estab);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrder = () => {
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("Order updated:", payload.new);
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
          <div className="container flex items-center gap-4 h-16">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-display font-bold text-lg">Acompanhar Pedido</h1>
          </div>
        </header>
        <div className="container py-20 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Pedido não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível encontrar este pedido.
          </p>
          <Link to="/">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(order.status);
  const StatusIcon = statusConfig[order.status]?.icon || Package;
  const isDelivering = order.status === "out_for_delivery";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center gap-4 h-16">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-lg">Pedido #{order.order_number}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <Badge className={statusConfig[order.status]?.color}>
            {statusConfig[order.status]?.label}
          </Badge>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Live Map (only when out for delivery) */}
        {isDelivering && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bike className="w-4 h-4 text-green-500" />
                  Acompanhe seu entregador
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DriverTrackingMap
                  orderId={order.id}
                  deliveryLatitude={order.delivery_latitude}
                  deliveryLongitude={order.delivery_longitude}
                  establishmentLatitude={establishment?.latitude ? Number(establishment.latitude) : undefined}
                  establishmentLongitude={establishment?.longitude ? Number(establishment.longitude) : undefined}
                  className="h-64 rounded-lg"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Status Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusOrder.slice(0, -1).map((status, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const config = statusConfig[status];
                  const Icon = config.icon;

                  return (
                    <div key={status} className="flex items-center gap-4">
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center transition-all
                          ${isCompleted ? config.color : "bg-muted"}
                          ${isCurrent ? "ring-2 ring-offset-2 ring-primary" : ""}
                        `}
                      >
                        <Icon className={`w-5 h-5 ${isCompleted ? "text-white" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? "" : "text-muted-foreground"}`}>
                          {config.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-primary animate-pulse">Em andamento...</p>
                        )}
                      </div>
                      {isCompleted && !isCurrent && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Establishment Info */}
        {establishment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Estabelecimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {establishment.logo_url ? (
                    <img
                      src={establishment.logo_url}
                      alt={establishment.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Store className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{establishment.name}</p>
                    <p className="text-sm text-muted-foreground">{establishment.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Delivery Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{order.delivery_address}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 border-b border-border last:border-0"
                  >
                    <span>
                      {item.quantity}x {item.product_name}
                    </span>
                    <span className="font-medium">
                      R$ {item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de entrega</span>
                  <span>R$ {order.delivery_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderTracking;
