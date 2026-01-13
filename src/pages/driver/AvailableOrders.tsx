import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DriverSidebar from "@/components/driver/DriverSidebar";
import {
  Package,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowLeft,
  Store,
  RefreshCw,
  Bike,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Establishment = Database["public"]["Tables"]["establishments"]["Row"];

interface OrderWithEstablishment extends Order {
  establishment?: Establishment;
}

const AvailableOrders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isDriver } = useAuth();
  const [orders, setOrders] = useState<OrderWithEstablishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCurrentOrder, setHasCurrentOrder] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchOrders();
      checkCurrentOrder();
      subscribeToOrders();
    }
  }, [user, authLoading, isDriver, navigate]);

  const checkCurrentOrder = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("driver_id", user!.id)
      .eq("status", "out_for_delivery")
      .maybeSingle();

    setHasCurrentOrder(!!data);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch ready orders without driver
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "ready")
        .is("driver_id", null)
        .order("created_at", { ascending: true });

      if (ordersData && ordersData.length > 0) {
        // Fetch establishment info for each order
        const establishmentIds = [...new Set(ordersData.map((o) => o.establishment_id))];
        const { data: establishments } = await supabase
          .from("establishments")
          .select("*")
          .in("id", establishmentIds);

        const ordersWithEstab = ordersData.map((order) => ({
          ...order,
          establishment: establishments?.find((e) => e.id === order.establishment_id),
        }));

        setOrders(ordersWithEstab);
      } else {
        setOrders([]);
      }
    } catch (error) {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel("available-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: "status=eq.ready",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const acceptOrder = async (orderId: string) => {
    if (hasCurrentOrder) {
      toast.error("Você já tem uma entrega em andamento. Finalize-a primeiro.");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        driver_id: user!.id,
        status: "out_for_delivery",
        out_for_delivery_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "ready")
      .is("driver_id", null);

    if (error) {
      toast.error("Erro ao aceitar pedido. Talvez outro entregador já aceitou.");
    } else {
      toast.success("Pedido aceito! Boa entrega!");
      setHasCurrentOrder(true);
      navigate("/entregador/em-rota");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DriverSidebar />

      <main className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/entregador")}
                className="p-2 hover:bg-muted rounded-lg lg:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg">Pedidos Disponíveis</h1>
              <Badge variant="secondary">{orders.length}</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {hasCurrentOrder && (
            <Card className="mb-4 border-yellow-500 bg-yellow-500/10">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Você tem uma entrega em andamento
                  </p>
                  <Button size="sm" onClick={() => navigate("/entregador/em-rota")}>
                    Ver Entrega
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bike className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum pedido disponível</p>
              <p className="text-sm">Novos pedidos prontos aparecerão aqui automaticamente</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {orders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="hover:border-primary transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Pedido #{order.order_number}
                          </CardTitle>
                          <Badge className="bg-green-500">Pronto</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Establishment */}
                        {order.establishment && (
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                            {order.establishment.logo_url ? (
                              <img
                                src={order.establishment.logo_url}
                                alt={order.establishment.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Store className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{order.establishment.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.establishment.address}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Delivery Info */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">{order.customer_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.delivery_address}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Pronto às{" "}
                              {new Date(order.ready_at || order.created_at).toLocaleTimeString(
                                "pt-BR",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Earnings */}
                        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <span className="font-bold text-green-600">
                              R$ {Number(order.delivery_fee).toFixed(2)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Taxa de entrega
                          </span>
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => acceptOrder(order.id)}
                          disabled={hasCurrentOrder}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aceitar Entrega
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AvailableOrders;
