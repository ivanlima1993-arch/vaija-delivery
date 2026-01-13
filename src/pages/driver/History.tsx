import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DriverSidebar from "@/components/driver/DriverSidebar";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Package,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const History = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isDriver } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      navigate("/auth");
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

      const { data } = await query;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = orders.reduce((acc, o) => acc + Number(o.delivery_fee), 0);
  const avgDeliveryTime = orders.length > 0
    ? orders.reduce((acc, o) => {
        if (o.out_for_delivery_at && o.delivered_at) {
          const start = new Date(o.out_for_delivery_at).getTime();
          const end = new Date(o.delivered_at).getTime();
          return acc + (end - start) / 60000;
        }
        return acc;
      }, 0) / orders.length
    : 0;

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/entregador")}
              className="p-2 hover:bg-muted rounded-lg lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">Histórico de Entregas</h1>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
          {/* Filter */}
          <div className="flex gap-2">
            {[
              { key: "week" as const, label: "Última Semana" },
              { key: "month" as const, label: "Último Mês" },
              { key: "all" as const, label: "Todas" },
            ].map((item) => (
              <Button
                key={item.key}
                variant={filter === item.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Entregas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Ganhos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">{Math.round(avgDeliveryTime)} min</p>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Entregas Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma entrega encontrada no período</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order, idx) => {
                    const deliveryTime =
                      order.out_for_delivery_at && order.delivered_at
                        ? Math.round(
                            (new Date(order.delivered_at).getTime() -
                              new Date(order.out_for_delivery_at).getTime()) /
                              60000
                          )
                        : null;

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border rounded-xl p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{order.order_number}</Badge>
                            <Badge className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Entregue
                            </Badge>
                          </div>
                          <span className="font-bold text-green-600">
                            +R$ {Number(order.delivery_fee).toFixed(2)}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{order.delivery_address}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {new Date(order.delivered_at!).toLocaleDateString("pt-BR")}
                            </div>
                            {deliveryTime && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {deliveryTime} min
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default History;
