import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DriverSidebar from "@/components/driver/DriverSidebar";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  Wallet,
  PiggyBank,
  Clock,
  Star,
  Menu,
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface DailyEarning {
  date: string;
  dayLabel: string;
  earnings: number;
  deliveries: number;
}

const Earnings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isDriver } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [chartData, setChartData] = useState<DailyEarning[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalDeliveries: 0,
    avgPerDelivery: 0,
    bestDay: { date: "", amount: 0 },
    weeklyChange: 0,
    avgRating: 0,
    pendingBalance: 0,
  });

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchEarnings();
    }
  }, [user, authLoading, isDriver, navigate, period]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      // Determine date range
      const now = new Date();
      let startDate: Date;
      let endDate = now;

      if (period === "week") {
        startDate = startOfWeek(now, { weekStartsOn: 0 });
      } else if (period === "month") {
        startDate = startOfMonth(now);
      } else {
        startDate = subDays(now, 365);
      }

      // Fetch delivered orders
      const { data: deliveredOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("driver_id", user!.id)
        .eq("status", "delivered")
        .gte("delivered_at", startDate.toISOString())
        .lte("delivered_at", endDate.toISOString())
        .order("delivered_at", { ascending: false });

      const orders = deliveredOrders || [];
      setOrders(orders);

      // Calculate stats
      const totalEarnings = orders.reduce((acc, o) => acc + Number(o.delivery_fee), 0);
      const totalDeliveries = orders.length;
      const avgPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

      // Find best day
      const dayEarnings: { [key: string]: number } = {};
      orders.forEach((o) => {
        const day = format(new Date(o.delivered_at!), "yyyy-MM-dd");
        dayEarnings[day] = (dayEarnings[day] || 0) + Number(o.delivery_fee);
      });

      let bestDay = { date: "", amount: 0 };
      Object.entries(dayEarnings).forEach(([date, amount]) => {
        if (amount > bestDay.amount) {
          bestDay = { date, amount };
        }
      });

      // Calculate weekly change
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
      const lastWeekStart = subDays(thisWeekStart, 7);
      const lastWeekEnd = subDays(thisWeekStart, 1);

      const { data: lastWeekOrders } = await supabase
        .from("orders")
        .select("delivery_fee")
        .eq("driver_id", user!.id)
        .eq("status", "delivered")
        .gte("delivered_at", lastWeekStart.toISOString())
        .lte("delivered_at", lastWeekEnd.toISOString());

      const thisWeekEarnings = orders
        .filter((o) => new Date(o.delivered_at!) >= thisWeekStart)
        .reduce((acc, o) => acc + Number(o.delivery_fee), 0);
      const lastWeekEarnings = (lastWeekOrders || []).reduce((acc, o) => acc + Number(o.delivery_fee), 0);

      const weeklyChange =
        lastWeekEarnings > 0
          ? ((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100
          : thisWeekEarnings > 0
          ? 100
          : 0;

      // Fetch average rating
      const { data: reviews } = await supabase
        .from("reviews")
        .select("driver_rating")
        .eq("driver_id", user!.id)
        .not("driver_rating", "is", null);

      const avgRating =
        reviews && reviews.length > 0
          ? reviews.reduce((acc, r) => acc + (r.driver_rating || 0), 0) / reviews.length
          : 0;

      setStats({
        totalEarnings,
        totalDeliveries,
        avgPerDelivery,
        bestDay,
        weeklyChange,
        avgRating,
        pendingBalance: totalEarnings, // Simplified - in real app, track payouts
      });

      // Build chart data
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const chartData: DailyEarning[] = days.map((day) => {
        const dayOrders = orders.filter((o) =>
          isSameDay(new Date(o.delivered_at!), day)
        );
        return {
          date: format(day, "yyyy-MM-dd"),
          dayLabel: format(day, period === "year" ? "MMM" : "EEE", { locale: ptBR }),
          earnings: dayOrders.reduce((acc, o) => acc + Number(o.delivery_fee), 0),
          deliveries: dayOrders.length,
        };
      });

      // For year view, aggregate by month
      if (period === "year") {
        const monthlyData: { [key: string]: DailyEarning } = {};
        chartData.forEach((d) => {
          const month = format(new Date(d.date), "yyyy-MM");
          if (!monthlyData[month]) {
            monthlyData[month] = {
              date: month,
              dayLabel: format(new Date(d.date), "MMM", { locale: ptBR }),
              earnings: 0,
              deliveries: 0,
            };
          }
          monthlyData[month].earnings += d.earnings;
          monthlyData[month].deliveries += d.deliveries;
        });
        setChartData(Object.values(monthlyData));
      } else {
        setChartData(chartData);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
      <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1">
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
                <Wallet className="w-6 h-6 text-primary" />
                <h1 className="font-bold text-lg">Meus Ganhos</h1>
              </div>
            </div>
            <Select value={period} onValueChange={(v: "week" | "month" | "year") => setPeriod(v)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/80 text-sm mb-1">Saldo Disponível</p>
                    <p className="text-4xl font-bold mb-2">{formatCurrency(stats.pendingBalance)}</p>
                    <div className="flex items-center gap-2 text-sm">
                      {stats.weeklyChange >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>
                        {stats.weeklyChange >= 0 ? "+" : ""}
                        {stats.weeklyChange.toFixed(1)}% vs semana anterior
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <PiggyBank className="w-16 h-16 opacity-30" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total de Entregas",
                value: stats.totalDeliveries.toString(),
                icon: Package,
                color: "text-blue-500",
              },
              {
                label: "Ganhos no Período",
                value: formatCurrency(stats.totalEarnings),
                icon: DollarSign,
                color: "text-green-500",
              },
              {
                label: "Média por Entrega",
                value: formatCurrency(stats.avgPerDelivery),
                icon: TrendingUp,
                color: "text-purple-500",
              },
              {
                label: "Avaliação Média",
                value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—",
                icon: Star,
                color: "text-yellow-500",
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
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Best Day Banner */}
          {stats.bestDay.date && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-500/20 p-2 rounded-full">
                        <Star className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Melhor dia</p>
                        <p className="font-medium">
                          {format(new Date(stats.bestDay.date), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-yellow-600">
                      {formatCurrency(stats.bestDay.amount)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução dos Ganhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="dayLabel"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        tickFormatter={(value) => `R$${value}`}
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as DailyEarning;
                            return (
                              <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{data.dayLabel}</p>
                                <p className="text-green-600 font-bold">
                                  {formatCurrency(data.earnings)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {data.deliveries} entrega{data.deliveries !== 1 ? "s" : ""}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorEarnings)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Sem dados para exibir</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Deliveries */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Entregas Recentes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/entregador/historico")}>
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma entrega no período</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order, idx) => {
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
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500/10 p-2 rounded-full">
                            <Package className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                #{order.order_number}
                              </Badge>
                              {deliveryTime && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {deliveryTime} min
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(order.delivered_at!), "dd/MM 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-green-600">
                          +{formatCurrency(Number(order.delivery_fee))}
                        </span>
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

export default Earnings;
