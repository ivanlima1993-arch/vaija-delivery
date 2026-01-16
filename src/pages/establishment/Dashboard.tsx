import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrderNotification } from "@/hooks/useOrderNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Store,
  ShoppingBag,
  DollarSign,
  Clock,
  TrendingUp,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Bell,
  Volume2,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Establishment = Database["public"]["Tables"]["establishments"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];

const EstablishmentDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isEstablishment, signOut } = useAuth();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Real-time order notifications
  const { playNotificationSound } = useOrderNotification({
    establishmentId: establishment?.id || null,
    onNewOrder: (order) => {
      setOrders((prev) => [order, ...prev]);
    },
    onOrderUpdate: (order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? order : o))
      );
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user && !isEstablishment) {
      toast.error("Você não tem acesso a esta área");
      navigate("/");
      return;
    }

    if (user) {
      fetchEstablishment();
    }
  }, [user, authLoading, isEstablishment, navigate]);

  const fetchEstablishment = async () => {
    try {
      const { data: estab, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (estab) {
        setEstablishment(estab);
        fetchOrders(estab.id);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar estabelecimento");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (establishmentId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setOrders(data);
    }
  };

  const toggleOpen = async () => {
    if (!establishment) return;

    const { error } = await supabase
      .from("establishments")
      .update({ is_open: !establishment.is_open })
      .eq("id", establishment.id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      setEstablishment({ ...establishment, is_open: !establishment.is_open });
      toast.success(establishment.is_open ? "Loja fechada" : "Loja aberta!");
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const todayOrders = orders.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Nenhum estabelecimento encontrado</h2>
            <p className="text-muted-foreground mb-4">
              Você ainda não cadastrou seu estabelecimento.
            </p>
            <Button onClick={() => navigate("/auth?mode=register-establishment")}>
              Cadastrar Estabelecimento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-primary p-1.5 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">VAIJÁ</span>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
            <TrendingUp className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => navigate("/estabelecimento/pedidos")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <ShoppingBag className="w-5 h-5" />
            Pedidos
            {pendingOrders.length > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {pendingOrders.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => navigate("/estabelecimento/cardapio")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <Package className="w-5 h-5" />
            Cardápio
          </button>
          <button
            onClick={() => navigate("/estabelecimento/configuracoes")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <Settings className="w-5 h-5" />
            Configurações
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
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
                <h1 className="font-bold text-lg">{establishment.name}</h1>
                <div className="flex items-center gap-2">
                  {establishment.is_approved ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Aprovado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Aguardando Aprovação
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {establishment.is_open ? "Aberto" : "Fechado"}
                </span>
                <Switch
                  checked={establishment.is_open}
                  onCheckedChange={toggleOpen}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) {
                    playNotificationSound();
                  }
                }}
                className={`relative p-2 rounded-lg transition-colors ${
                  soundEnabled ? "hover:bg-muted" : "bg-muted/50 text-muted-foreground"
                }`}
                title={soundEnabled ? "Som ativado" : "Som desativado"}
              >
                <Volume2 className={`w-5 h-5 ${!soundEnabled ? "opacity-50" : ""}`} />
              </button>
              <button className="relative p-2 hover:bg-muted rounded-lg">
                <Bell className="w-5 h-5" />
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-6 space-y-6">
          {/* Stats Cards */}
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
                      <ShoppingBag className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{todayOrders.length}</p>
                      <p className="text-sm text-muted-foreground">Pedidos Hoje</p>
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
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        R$ {todayRevenue.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">Faturamento</p>
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
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pendingOrders.length}</p>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
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
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{preparingOrders.length}</p>
                      <p className="text-sm text-muted-foreground">Preparando</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pedidos Recentes</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/estabelecimento/pedidos")}
                >
                  Ver todos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum pedido ainda</p>
                  <p className="text-sm">Os pedidos aparecerão aqui em tempo real</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
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
                            order.status === "pending"
                              ? "destructive"
                              : order.status === "preparing"
                              ? "default"
                              : "outline"
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
      </main>
    </div>
  );
};

export default EstablishmentDashboard;
