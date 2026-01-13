import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DriverSidebar from "@/components/driver/DriverSidebar";
import {
  Package,
  MapPin,
  DollarSign,
  Clock,
  TrendingUp,
  Bike,
  CheckCircle,
  Navigation,
  Menu,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isDriver } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    weekDeliveries: 0,
    weekEarnings: 0,
    avgDeliveryTime: 0,
  });
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchDashboardData();
      subscribeToOrders();
    }
  }, [user, authLoading, isDriver, navigate]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Fetch driver's delivered orders
      const { data: deliveredOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("driver_id", user!.id)
        .eq("status", "delivered");

      if (deliveredOrders) {
        const todayOrders = deliveredOrders.filter(
          (o) => new Date(o.delivered_at!) >= today
        );
        const weekOrders = deliveredOrders.filter(
          (o) => new Date(o.delivered_at!) >= weekAgo
        );

        // Calculate average delivery time
        let totalTime = 0;
        let validOrders = 0;
        deliveredOrders.forEach((o) => {
          if (o.out_for_delivery_at && o.delivered_at) {
            const start = new Date(o.out_for_delivery_at).getTime();
            const end = new Date(o.delivered_at).getTime();
            totalTime += (end - start) / 60000; // minutes
            validOrders++;
          }
        });

        setStats({
          todayDeliveries: todayOrders.length,
          todayEarnings: todayOrders.reduce((acc, o) => acc + Number(o.delivery_fee), 0),
          weekDeliveries: weekOrders.length,
          weekEarnings: weekOrders.reduce((acc, o) => acc + Number(o.delivery_fee), 0),
          avgDeliveryTime: validOrders > 0 ? Math.round(totalTime / validOrders) : 0,
        });
      }

      // Fetch current order (in delivery)
      const { data: inDelivery } = await supabase
        .from("orders")
        .select("*")
        .eq("driver_id", user!.id)
        .eq("status", "out_for_delivery")
        .maybeSingle();

      setCurrentOrder(inDelivery);

      // Fetch available orders (ready for pickup, no driver assigned)
      const { data: available } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "ready")
        .is("driver_id", null)
        .order("created_at", { ascending: true })
        .limit(5);

      setAvailableOrders(available || []);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel("driver-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const acceptOrder = async (orderId: string) => {
    if (currentOrder) {
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
      fetchDashboardData();
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

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bike className="w-6 h-6 text-primary" />
            <span className="font-bold">Entregador</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background pt-16">
          <nav className="p-4 space-y-2">
            {[
              { label: "Dashboard", path: "/entregador" },
              { label: "Disponíveis", path: "/entregador/disponiveis" },
              { label: "Em Rota", path: "/entregador/em-rota" },
              { label: "Histórico", path: "/entregador/historico" },
              { label: "Configurações", path: "/entregador/configuracoes" },
            ].map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate(item.path);
                  setShowMobileMenu(false);
                }}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Status Toggle */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className={isOnline ? "border-green-500 bg-green-500/5" : "border-red-500 bg-red-500/5"}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                  <span className="font-medium">
                    {isOnline ? "Você está online" : "Você está offline"}
                  </span>
                </div>
                <Switch
                  checked={isOnline}
                  onCheckedChange={setIsOnline}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Current Order */}
          {currentOrder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <Card className="border-primary border-2 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-primary animate-pulse" />
                      Entrega em Andamento
                    </CardTitle>
                    <Badge className="bg-purple-500">
                      Pedido #{currentOrder.order_number}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-background rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{currentOrder.customer_name}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm">{currentOrder.delivery_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-bold text-green-600">
                        R$ {Number(currentOrder.delivery_fee).toFixed(2)} de taxa
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => navigate("/entregador/em-rota")}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Ver Detalhes da Entrega
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Entregas Hoje",
                value: stats.todayDeliveries,
                icon: Package,
                color: "text-blue-500",
              },
              {
                label: "Ganhos Hoje",
                value: `R$ ${stats.todayEarnings.toFixed(2)}`,
                icon: DollarSign,
                color: "text-green-500",
              },
              {
                label: "Entregas Semana",
                value: stats.weekDeliveries,
                icon: TrendingUp,
                color: "text-purple-500",
              },
              {
                label: "Tempo Médio",
                value: `${stats.avgDeliveryTime} min`,
                icon: Clock,
                color: "text-orange-500",
              },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Available Orders */}
          {!currentOrder && isOnline && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Pedidos Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bike className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum pedido disponível no momento</p>
                    <p className="text-sm">Novos pedidos aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border rounded-xl p-4 hover:border-primary transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline">Pedido #{order.order_number}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-primary mt-0.5" />
                            <span className="text-sm">{order.delivery_address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-green-600">
                              R$ {Number(order.delivery_fee).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => acceptOrder(order.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aceitar Entrega
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
