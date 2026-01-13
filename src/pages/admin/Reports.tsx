import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Menu,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Store,
  Users,
  Calendar,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Establishment = Database["public"]["Tables"]["establishments"]["Row"];

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "#10b981", "#f59e0b", "#6366f1", "#8b5cf6"];

const AdminReports = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [pendingEstablishments, setPendingEstablishments] = useState(0);
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });

  const [ordersByDay, setOrdersByDay] = useState<{ date: string; orders: number; revenue: number }[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<{ name: string; value: number }[]>([]);
  const [ordersByPayment, setOrdersByPayment] = useState<{ name: string; value: number }[]>([]);
  const [topEstablishments, setTopEstablishments] = useState<{ name: string; orders: number; revenue: number }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user && !isAdmin) {
      toast.error("Acesso negado. Área restrita para administradores.");
      navigate("/");
      return;
    }

    if (user && isAdmin) {
      fetchReportData();
      fetchPendingEstablishments();
    }
  }, [user, authLoading, isAdmin, navigate, period]);

  const fetchPendingEstablishments = async () => {
    const { count } = await supabase
      .from("establishments")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false);
    setPendingEstablishments(count || 0);
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      // Fetch orders
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", daysAgo.toISOString())
        .order("created_at", { ascending: true });

      // Fetch establishments
      const { data: establishments } = await supabase
        .from("establishments")
        .select("*");

      if (orders) {
        // Calculate stats
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
        const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
        const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
          deliveredOrders,
          cancelledOrders,
        });

        // Orders by day
        const byDay: Record<string, { orders: number; revenue: number }> = {};
        orders.forEach((order) => {
          const date = new Date(order.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          });
          if (!byDay[date]) {
            byDay[date] = { orders: 0, revenue: 0 };
          }
          byDay[date].orders++;
          byDay[date].revenue += Number(order.total);
        });
        setOrdersByDay(
          Object.entries(byDay).map(([date, data]) => ({
            date,
            orders: data.orders,
            revenue: data.revenue,
          }))
        );

        // Orders by status
        const byStatus: Record<string, number> = {};
        orders.forEach((order) => {
          byStatus[order.status] = (byStatus[order.status] || 0) + 1;
        });
        
        const statusLabels: Record<string, string> = {
          pending: "Pendente",
          confirmed: "Confirmado",
          preparing: "Preparando",
          ready: "Pronto",
          out_for_delivery: "Em entrega",
          delivered: "Entregue",
          cancelled: "Cancelado",
        };
        
        setOrdersByStatus(
          Object.entries(byStatus).map(([status, count]) => ({
            name: statusLabels[status] || status,
            value: count,
          }))
        );

        // Orders by payment method
        const byPayment: Record<string, number> = {};
        orders.forEach((order) => {
          byPayment[order.payment_method] = (byPayment[order.payment_method] || 0) + 1;
        });
        
        const paymentLabels: Record<string, string> = {
          pix: "PIX",
          credit_card: "Cartão Crédito",
          debit_card: "Cartão Débito",
          cash: "Dinheiro",
        };
        
        setOrdersByPayment(
          Object.entries(byPayment).map(([method, count]) => ({
            name: paymentLabels[method] || method,
            value: count,
          }))
        );

        // Top establishments
        const byEstablishment: Record<string, { orders: number; revenue: number }> = {};
        orders.forEach((order) => {
          if (!byEstablishment[order.establishment_id]) {
            byEstablishment[order.establishment_id] = { orders: 0, revenue: 0 };
          }
          byEstablishment[order.establishment_id].orders++;
          byEstablishment[order.establishment_id].revenue += Number(order.total);
        });

        const topEstab = Object.entries(byEstablishment)
          .map(([id, data]) => {
            const estab = establishments?.find((e) => e.id === id);
            return {
              name: estab?.name || "Desconhecido",
              orders: data.orders,
              revenue: data.revenue,
            };
          })
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setTopEstablishments(topEstab);
      }
    } catch (error) {
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
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
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingEstablishments={pendingEstablishments}
      />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg">Relatórios</h1>
                <p className="text-sm text-muted-foreground">
                  Análise de desempenho da plataforma
                </p>
              </div>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      R$ {stats.totalRevenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Receita Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stats.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">Total Pedidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      R$ {stats.avgOrderValue.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Ticket Médio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stats.deliveredOrders}</p>
                    <p className="text-xs text-muted-foreground">Entregues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stats.cancelledOrders}</p>
                    <p className="text-xs text-muted-foreground">Cancelados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersByDay.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Sem dados para o período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={ordersByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Revenue Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersByDay.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Sem dados para o período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={ordersByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Por Status</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersByStatus.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Sem dados
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={ordersByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {ordersByStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {ordersByStatus.map((item, index) => (
                    <Badge key={item.name} variant="outline" className="text-xs">
                      <span
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Orders by Payment */}
            <Card>
              <CardHeader>
                <CardTitle>Por Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersByPayment.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Sem dados
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={ordersByPayment}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {ordersByPayment.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {ordersByPayment.map((item, index) => (
                    <Badge key={item.name} variant="outline" className="text-xs">
                      <span
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Establishments */}
            <Card>
              <CardHeader>
                <CardTitle>Top Estabelecimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {topEstablishments.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Sem dados
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topEstablishments.map((estab, index) => (
                      <div
                        key={estab.name}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-muted-foreground">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[120px]">
                              {estab.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {estab.orders} pedidos
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-primary">
                          R$ {estab.revenue.toFixed(0)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminReports;
