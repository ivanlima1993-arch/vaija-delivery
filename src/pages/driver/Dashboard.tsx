import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDriverOrderNotifications } from "@/hooks/useDriverOrderNotifications";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Bike,
  Package,
  Clock,
  DollarSign,
  MapPin,
  Navigation,
  TrendingUp,
  Menu,
  ChevronRight,
  Bell,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import DriverSidebar from "@/components/driver/DriverSidebar";

interface Stats {
  todayDeliveries: number;
  todayEarnings: number;
  weekDeliveries: number;
  weekEarnings: number;
  avgDeliveryTime: number;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  delivery_address: string;
  delivery_fee: number;
  status: string;
  created_at: string;
  establishment_id: string;
}

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { user, isDriver, isDriverApproved, driverRejectionReason, driverRegistrationSubmittedAt, loading: authLoading } = useAuth();
  const { requestNotificationPermission } = useDriverOrderNotifications();
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!driverRegistrationSubmittedAt || isDriverApproved) return;

    const calculateTimeLeft = () => {
      const submissionDate = new Date(driverRegistrationSubmittedAt);
      const targetDate = new Date(submissionDate.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft("Em breve");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [driverRegistrationSubmittedAt, isDriverApproved]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [stats, setStats] = useState<Stats>({
    todayDeliveries: 0,
    todayEarnings: 0,
    weekDeliveries: 0,
    weekEarnings: 0,
    avgDeliveryTime: 0,
  });
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);

  // Check notification permission status
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      toast.success("Notificações ativadas! Você receberá alertas de novos pedidos.");
    } else {
      toast.error("Permissão negada. Ative nas configurações do navegador.");
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      navigate("/entregador/auth");
      return;
    }

    if (user) {
      fetchDashboardData();
      const cleanup = subscribeToOrders();
      return cleanup;
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

    return () => {
      supabase.removeChannel(channel);
    };
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
      navigate("/entregador/em-rota");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500"></div>
      </div>
    );
  }

  if (!isDriverApproved) {
    return (
      <div className="min-h-screen bg-background flex w-full">
        <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-6"
          >
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
              <Clock className="w-12 h-12 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">
                {driverRejectionReason ? "Cadastro Reprovado" : "Cadastro em Análise"}
              </h1>
              <p className="text-muted-foreground">
                {driverRejectionReason
                  ? "Seu cadastro não foi aprovado pelos seguintes motivos:"
                  : "Seu cadastro foi recebido e está sendo analisado pela nossa equipe."}
              </p>
              {driverRejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800/20 mt-4">
                  <p className="text-sm font-bold text-red-600 uppercase mb-1 flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Motivo da Recusa
                  </p>
                  <p className="text-foreground italic">"{driverRejectionReason}"</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Por favor, entre em contato com o suporte ou refaça seu cadastro corrigindo as informações acima.
                  </p>
                </div>
              )}
              {!driverRejectionReason && (
                <p className="text-sm text-emerald-600 font-medium">
                  Tempo estimado de análise: {timeLeft}
                </p>
              )}
            </div>
            <Card className="bg-muted/50 border-none">
              <CardContent className="pt-6">
                <p className="text-sm font-medium">O que acontece agora?</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-2">
                  <li>• Verificação dos seus documentos</li>
                  <li>• Validação do seu veículo</li>
                  <li>• Ativação da sua conta</li>
                  <li className="text-xs italic text-emerald-500 font-medium font-brand mt-2">
                    * Prazo de aprovação em até 24 horas.
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full h-12"
            >
              Verificar Novamente
            </Button>
          </motion.div>
        </div>
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
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-1.5 rounded-lg">
                  <Bike className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-lg">Dashboard</h1>
              </div>
            </div>

            {/* Status Toggle & Notifications */}
            <div className="flex items-center gap-3">
              {!notificationsEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableNotifications}
                  className="gap-1.5 text-xs"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ativar Notificações</span>
                </Button>
              )}
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isOnline ? "text-green-600" : "text-muted-foreground"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
                <Switch
                  checked={isOnline}
                  onCheckedChange={setIsOnline}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Current Order Alert */}
            {currentOrder && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-green-500 bg-green-500/10">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-full">
                          <Navigation className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">Entrega em andamento</p>
                          <p className="text-sm text-muted-foreground">
                            Pedido #{currentOrder.order_number}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate("/entregador/em-rota")}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Ver Rota
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Hoje</p>
                        <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
                        <p className="text-xs text-muted-foreground">entregas</p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ganhos Hoje</p>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {stats.todayEarnings.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Semana</p>
                        <p className="text-2xl font-bold">{stats.weekDeliveries}</p>
                        <p className="text-xs text-muted-foreground">entregas</p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo Médio</p>
                        <p className="text-2xl font-bold">{stats.avgDeliveryTime}</p>
                        <p className="text-xs text-muted-foreground">minutos</p>
                      </div>
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Available Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    Pedidos Disponíveis
                  </CardTitle>
                  <Badge variant="secondary">{availableOrders.length}</Badge>
                </CardHeader>
                <CardContent>
                  {!isOnline ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bike className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Fique online para ver pedidos disponíveis</p>
                    </div>
                  ) : currentOrder ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Navigation className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p>Finalize sua entrega atual para aceitar novos pedidos</p>
                    </div>
                  ) : availableOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhum pedido disponível no momento</p>
                      <p className="text-sm mt-1">Novos pedidos aparecerão aqui automaticamente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableOrders.map((order, index) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">#{order.order_number}</span>
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                R$ {Number(order.delivery_fee).toFixed(2)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{order.delivery_address}</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => acceptOrder(order.id)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 ml-3"
                          >
                            Aceitar
                          </Button>
                        </motion.div>
                      ))}

                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => navigate("/entregador/disponiveis")}
                      >
                        Ver Todos os Pedidos
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate("/entregador/ganhos")}
                >
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <span>Meus Ganhos</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate("/entregador/historico")}
                >
                  <Clock className="w-6 h-6 text-blue-600" />
                  <span>Histórico</span>
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverDashboard;
