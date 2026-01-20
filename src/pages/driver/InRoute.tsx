import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDriverLocationTracker } from "@/hooks/useDriverLocationTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DriverSidebar from "@/components/driver/DriverSidebar";
import DriverTrackingMap from "@/components/tracking/DriverTrackingMap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin,
  Phone,
  Navigation,
  CheckCircle,
  ArrowLeft,
  Store,
  Package,
  Clock,
  User,
  MessageCircle,
  Bike,
  Radio,
  Menu,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type Establishment = Database["public"]["Tables"]["establishments"]["Row"];

const InRoute = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isDriver } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Location tracker hook - initialized after order is loaded
  const {
    isTracking,
    lastUpdate,
    startTracking,
    stopTracking,
    isSupported: isGeoSupported,
  } = useDriverLocationTracker({
    orderId: order?.id || "",
    driverId: user?.id || "",
    updateIntervalMs: 5000,
    onError: (error) => console.error("Tracking error:", error),
  });

  // Auto-start tracking when order is loaded
  useEffect(() => {
    if (order && user && isGeoSupported && !isTracking) {
      startTracking();
    }
  }, [order, user, isGeoSupported]);

  // Stop tracking when leaving page or order is delivered
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [isTracking, stopTracking]);

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchCurrentOrder();
    }
  }, [user, authLoading, isDriver, navigate]);

  const fetchCurrentOrder = async () => {
    try {
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("driver_id", user!.id)
        .eq("status", "out_for_delivery")
        .maybeSingle();

      if (orderData) {
        setOrder(orderData);

        // Fetch order items
        const { data: items } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderData.id);

        setOrderItems(items || []);

        // Fetch establishment
        const { data: estab } = await supabase
          .from("establishments")
          .select("*")
          .eq("id", orderData.establishment_id)
          .maybeSingle();

        setEstablishment(estab);
      }
    } catch (error) {
      toast.error("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async () => {
    if (!order) return;

    const { error } = await supabase
      .from("orders")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (error) {
      toast.error("Erro ao confirmar entrega");
    } else {
      toast.success("Entrega confirmada com sucesso! 🎉");
      setShowConfirmDialog(false);
      navigate("/entregador");
    }
  };

  const openInMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
  };

  const callCustomer = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex">
        <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Bike className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-bold mb-2">Nenhuma entrega em andamento</h2>
            <p className="text-muted-foreground mb-4">
              Aceite um pedido para iniciar uma entrega
            </p>
            <Button onClick={() => navigate("/entregador/disponiveis")}>
              Ver Pedidos Disponíveis
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const deliveryTime = order.out_for_delivery_at
    ? Math.round((Date.now() - new Date(order.out_for_delivery_at).getTime()) / 60000)
    : 0;

  return (
    <div className="min-h-screen bg-background flex">
      <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-muted rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-lg">Entrega em Andamento</h1>
              <p className="text-sm text-muted-foreground">
                Pedido #{order.order_number}
              </p>
            </div>
            <Badge className="bg-purple-500 animate-pulse">
              <Navigation className="w-3 h-3 mr-1" />
              Em Rota
            </Badge>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
          {/* Live Tracking Map */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    Rastreamento ao Vivo
                  </div>
                  <Badge variant={isTracking ? "default" : "secondary"} className={isTracking ? "bg-green-500" : ""}>
                    {isTracking ? "Ativo" : "Pausado"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DriverTrackingMap
                  orderId={order.id}
                  deliveryLatitude={order.delivery_latitude}
                  deliveryLongitude={order.delivery_longitude}
                  establishmentLatitude={establishment?.latitude ? Number(establishment.latitude) : undefined}
                  establishmentLongitude={establishment?.longitude ? Number(establishment.longitude) : undefined}
                  className="h-48 rounded-lg"
                />
                {lastUpdate && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Última atualização: {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  {isTracking ? (
                    <Button variant="outline" size="sm" className="flex-1" onClick={stopTracking}>
                      Pausar Rastreamento
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1" onClick={startTracking}>
                      Ativar Rastreamento
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timer */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-primary bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-medium">Tempo em rota</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {deliveryTime} min
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pickup Info */}
          {establishment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Local de Retirada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    {establishment.logo_url ? (
                      <img
                        src={establishment.logo_url}
                        alt={establishment.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Store className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{establishment.name}</p>
                      <p className="text-sm text-muted-foreground">{establishment.address}</p>
                    </div>
                  </div>
                  {establishment.phone && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => callCustomer(establishment.phone!)}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Ligar para Estabelecimento
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Delivery Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Entregar em
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold">{order.customer_name}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5" />
                    <span>{order.delivery_address}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => callCustomer(order.customer_phone)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openInMaps(order.delivery_address)}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    GPS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
                      className="flex justify-between items-center p-2 bg-muted/30 rounded-lg"
                    >
                      <span>
                        {item.quantity}x {item.product_name}
                      </span>
                    </div>
                  ))}
                </div>
                {order.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                          Observações
                        </p>
                        <p className="text-sm">{order.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Confirm Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              className="w-full h-14 text-lg"
              onClick={() => setShowConfirmDialog(true)}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Entrega
            </Button>
          </motion.div>
        </div>

        {/* Confirm Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Entrega</DialogTitle>
              <DialogDescription>
                Você confirma que o pedido #{order.order_number} foi entregue ao cliente{" "}
                <strong>{order.customer_name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmDelivery}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Entrega
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default InRoute;
