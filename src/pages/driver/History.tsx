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
  DollarSign,
  Clock,
  MapPin,
  Menu,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DriverSidebar from "@/components/driver/DriverSidebar";

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  delivery_address: string;
  delivery_fee: number;
  delivered_at: string;
  out_for_delivery_at: string | null;
}

type FilterType = "week" | "month" | "all";

const DriverHistory = () => {
  const navigate = useNavigate();
  const { user, isDriver, isDriverApproved, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterType>("week");

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      navigate("/entregador/auth");
      return;
    }

    if (!authLoading && user && isDriver && !isDriverApproved) {
      navigate("/entregador");
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, isDriver, navigate, filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select("*")
        .eq("driver_id", user!.id)
        .eq("status", "delivered")
        .order("delivered_at", { ascending: false });

      if (filter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("delivered_at", weekAgo.toISOString());
      } else if (filter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte("delivered_at", monthAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = orders.reduce((acc, o) => acc + Number(o.delivery_fee), 0);

  const avgDeliveryTime = () => {
    const validOrders = orders.filter(o => o.out_for_delivery_at && o.delivered_at);
    if (validOrders.length === 0) return 0;

    const totalTime = validOrders.reduce((acc, o) => {
      const start = new Date(o.out_for_delivery_at!).getTime();
      const end = new Date(o.delivered_at).getTime();
      return acc + (end - start) / 60000;
    }, 0);

    return Math.round(totalTime / validOrders.length);
  };

  const getDeliveryTime = (order: Order) => {
    if (!order.out_for_delivery_at || !order.delivered_at) return "—";
    const start = new Date(order.out_for_delivery_at).getTime();
    const end = new Date(order.delivered_at).getTime();
    return `${Math.round((end - start) / 60000)} min`;
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
                <Clock className="w-5 h-5 text-green-600" />
                <h1 className="font-bold text-lg">Histórico</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Filters */}
            <div className="flex gap-2">
              {[
                { key: "week" as FilterType, label: "Última Semana" },
                { key: "month" as FilterType, label: "Último Mês" },
                { key: "all" as FilterType, label: "Todas" },
              ].map((item) => (
                <Button
                  key={item.key}
                  variant={filter === item.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(item.key)}
                  className={filter === item.key ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Package className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{orders.length}</p>
                    <p className="text-xs text-muted-foreground">Entregas</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6 text-center">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold text-green-600">
                      R$ {totalEarnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Ganhos</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold">{avgDeliveryTime()} min</p>
                    <p className="text-xs text-muted-foreground">Tempo Médio</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">Nenhuma entrega encontrada</h3>
                <p className="text-muted-foreground">
                  Suas entregas concluídas aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:border-green-500/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-bold">#{order.order_number}</span>
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              R$ {Number(order.delivery_fee).toFixed(2)}
                            </Badge>
                          </div>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {getDeliveryTime(order)}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{order.delivery_address}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(order.delivered_at), "dd 'de' MMMM 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
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

export default DriverHistory;
