import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { toast } from "sonner";
import {
  Store,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  Menu,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Establishment = Database["public"]["Tables"]["establishments"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEstablishments: 0,
    pendingEstablishments: 0,
    approvedEstablishments: 0,
    totalUsers: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
  });
  const [recentEstablishments, setRecentEstablishments] = useState<Establishment[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
      fetchDashboardData();
    }
  }, [user, authLoading, isAdmin, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch establishments stats
      const { data: establishments } = await supabase
        .from("establishments")
        .select("*")
        .order("created_at", { ascending: false });

      const pendingCount = establishments?.filter((e) => !e.is_approved).length || 0;
      const approvedCount = establishments?.filter((e) => e.is_approved).length || 0;

      // Fetch users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch orders
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      const today = new Date().toDateString();
      const todayOrders = orders?.filter(
        (o) => new Date(o.created_at).toDateString() === today
      ) || [];

      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

      setStats({
        totalEstablishments: establishments?.length || 0,
        pendingEstablishments: pendingCount,
        approvedEstablishments: approvedCount,
        totalUsers: usersCount || 0,
        totalOrders: orders?.length || 0,
        todayOrders: todayOrders.length,
        totalRevenue,
        todayRevenue,
      });

      setRecentEstablishments(establishments?.slice(0, 5) || []);
      setRecentOrders(orders?.slice(0, 5) || []);
    } catch (error) {
      toast.error("Erro ao carregar dados");
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
        pendingEstablishments={stats.pendingEstablishments}
      />

      <main className="flex-1 overflow-auto">
        {/* Header */}
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
                <h1 className="font-bold text-lg">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground">Visão geral do sistema</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalEstablishments}</p>
                      <p className="text-sm text-muted-foreground">Estabelecimentos</p>
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
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                      <p className="text-sm text-muted-foreground">Usuários</p>
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
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                      <ShoppingBag className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalOrders}</p>
                      <p className="text-sm text-muted-foreground">Pedidos Total</p>
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
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        R$ {stats.totalRevenue.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">Receita Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pedidos Hoje</p>
                    <p className="text-2xl font-bold">{stats.todayOrders}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Hoje</p>
                    <p className="text-2xl font-bold">R$ {stats.todayRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes Aprovação</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.pendingEstablishments}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Establishments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Estabelecimentos Recentes</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin/estabelecimentos")}
                  >
                    Ver todos
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentEstablishments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum estabelecimento cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentEstablishments.map((establishment) => (
                      <div
                        key={establishment.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {establishment.is_approved ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                          )}
                          <div>
                            <p className="font-medium">{establishment.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {establishment.category}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={establishment.is_approved ? "default" : "secondary"}
                        >
                          {establishment.is_approved ? "Aprovado" : "Pendente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pedidos Recentes</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin/relatorios")}
                  >
                    Ver relatórios
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido realizado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Pedido #{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            R$ {Number(order.total).toFixed(2)}
                          </p>
                          <Badge
                            variant={
                              order.status === "delivered"
                                ? "default"
                                : order.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {order.status === "pending" && "Pendente"}
                            {order.status === "confirmed" && "Confirmado"}
                            {order.status === "preparing" && "Preparando"}
                            {order.status === "ready" && "Pronto"}
                            {order.status === "out_for_delivery" && "Em entrega"}
                            {order.status === "delivered" && "Entregue"}
                            {order.status === "cancelled" && "Cancelado"}
                          </Badge>
                        </div>
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

export default AdminDashboard;
