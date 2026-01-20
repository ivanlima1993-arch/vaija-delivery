import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  MapPin,
  Clock,
  Store,
  RefreshCw,
  Menu,
  Navigation,
} from "lucide-react";
import { motion } from "framer-motion";
import DriverSidebar from "@/components/driver/DriverSidebar";

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  delivery_address: string;
  delivery_fee: number;
  status: string;
  created_at: string;
  establishment_id: string;
  establishments?: {
    name: string;
    address: string;
  };
}

const AvailableOrders = () => {
  const navigate = useNavigate();
  const { user, isDriver, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasCurrentOrder, setHasCurrentOrder] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      navigate("/entregador/auth");
      return;
    }

    if (user) {
      checkCurrentOrder();
      fetchOrders();
      const cleanup = subscribeToOrders();
      return cleanup;
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
      const { data, error } = await supabase
        .from("orders")
        .select("*, establishments(name, address)")
        .eq("status", "ready")
        .is("driver_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setOrders(data || []);
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
          checkCurrentOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const acceptOrder = async (orderId: string) => {
    if (hasCurrentOrder) {
      toast.error("Você já tem uma entrega em andamento");
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

  const getTimeSinceOrder = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-muted rounded-lg lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                <h1 className="font-bold text-lg">Pedidos Disponíveis</h1>
                <Badge variant="secondary">{orders.length}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Current Order Alert */}
            {hasCurrentOrder && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-yellow-500 bg-yellow-500/10">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Navigation className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                          Você tem uma entrega em andamento
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => navigate("/entregador/em-rota")}
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        Ver Entrega
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">Nenhum pedido disponível</h3>
                <p className="text-muted-foreground">
                  Novos pedidos aparecerão aqui automaticamente
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:border-green-500/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg">#{order.order_number}</span>
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                R$ {Number(order.delivery_fee).toFixed(2)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Aguardando há {getTimeSinceOrder(order.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-start gap-2">
                            <Store className="w-4 h-4 text-orange-500 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {order.establishments?.name || "Estabelecimento"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {order.establishments?.address || "Endereço não disponível"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{order.customer_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {order.delivery_address}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={() => acceptOrder(order.id)}
                          disabled={hasCurrentOrder}
                          className="w-full bg-green-500 hover:bg-green-600"
                        >
                          {hasCurrentOrder ? "Finalize sua entrega atual" : "Aceitar Pedido"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AvailableOrders;
