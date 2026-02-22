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
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import {
  Store,
  ShoppingBag,
  DollarSign,
  Clock,
  Package,
  Menu,
  Bell,
  Volume2,
  UserPlus,
  Printer,
} from "lucide-react";
import LinkDriverDialog from "@/components/establishment/LinkDriverDialog";
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
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // Real-time order notifications with persistent sound
  const {
    playNotificationSound,
    stopAllSounds,
    hasPendingSounds
  } = useOrderNotification({
    establishmentId: establishment?.id || null,
    soundEnabled,
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

  const handlePrint = async (order: Order) => {
    // Fetch order items first
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    if (!items) {
      toast.error("Erro ao carregar itens para impressão");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Pedido #${order.order_number}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 300px; padding: 10px; font-size: 12px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .section { margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 5px; }
            .items { width: 100%; border-collapse: collapse; }
            .items th, .items td { text-align: left; padding: 2px 0; }
            .total-row { display: flex; justify-content: space-between; margin-top: 2px; }
            .total-final { border-top: 1px solid #000; margin-top: 5px; padding-top: 5px; font-weight: bold; font-size: 14px; display: flex; justify-content: space-between; }
            .notes { margin-top: 10px; background: #f9f9f9; padding: 5px; border: 1px solid #ddd; word-wrap: break-word; }
            @media print {
              body { margin: 0; padding: 5mm; }
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0;">Vai Já Delivery</h2>
            <p style="margin: 5px 0;">Pedido #${order.order_number}</p>
            <p style="margin: 0;">${new Date(order.created_at).toLocaleString("pt-BR")}</p>
          </div>
          
          <div class="section">
            <p><strong>Cliente:</strong> ${order.customer_name}</p>
            <p><strong>Telefone:</strong> ${order.customer_phone}</p>
            <p><strong>Endereço:</strong> ${order.delivery_address}</p>
          </div>

          <div class="section">
            <table class="items">
              <thead>
                <tr>
                  <th>Qtd</th>
                  <th>Item</th>
                  <th style="text-align: right;">v.Un</th>
                </tr>
              </thead>
              <tbody>
                ${items
        .map(
          (item) => `
                  <tr>
                    <td style="vertical-align: top; width: 30px;">${item.quantity}x</td>
                    <td style="vertical-align: top;">
                      ${item.product_name}
                      ${item.notes ? `<br/><small><i>- ${item.notes}</i></small>` : ""}
                    </td>
                    <td style="vertical-align: top; text-align: right;">R$ ${(Number(item.subtotal) / item.quantity).toFixed(2)}</td>
                  </tr>
                `
        )
        .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>R$ ${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Taxa Entrega:</span>
              <span>R$ ${Number(order.delivery_fee).toFixed(2)}</span>
            </div>
            ${Number(order.discount) > 0
        ? `<div class="total-row" style="color: green;">
                <span>Desconto:</span>
                <span>- R$ ${Number(order.discount).toFixed(2)}</span>
              </div>`
        : ""
      }
            <div class="total-final">
              <span>TOTAL:</span>
              <span>R$ ${Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          ${order.notes
        ? `
            <div class="notes">
              <strong>Observação do Pedido:</strong><br/>
              ${order.notes}
            </div>
          `
        : ""
      }

          <div style="text-align: center; margin-top: 20px; font-style: italic;">
            Obrigado pela preferência!
          </div>
          
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

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
      <EstablishmentSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingOrdersCount={pendingOrders.length}
      />

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
                  if (hasPendingSounds) {
                    stopAllSounds();
                  } else {
                    setSoundEnabled(!soundEnabled);
                    if (!soundEnabled) {
                      playNotificationSound();
                    }
                  }
                }}
                className={`relative p-2 rounded-lg transition-colors ${hasPendingSounds
                    ? "bg-destructive/10 hover:bg-destructive/20"
                    : soundEnabled
                      ? "hover:bg-muted"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                title={
                  hasPendingSounds
                    ? "Clique para silenciar alarme"
                    : soundEnabled
                      ? "Som ativado"
                      : "Som desativado"
                }
              >
                <Volume2
                  className={`w-5 h-5 ${hasPendingSounds
                      ? "text-destructive animate-pulse"
                      : !soundEnabled
                        ? "opacity-50"
                        : ""
                    }`}
                />
                {hasPendingSounds && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
              <button className="relative p-2 hover:bg-muted rounded-lg">
                <Bell className="w-5 h-5" />
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
              <Button
                onClick={() => setLinkDialogOpen(true)}
                className="hidden md:flex gap-2"
                size="sm"
              >
                <UserPlus className="w-4 h-4" />
                Vincular Entregador
              </Button>
              <Button
                onClick={() => setLinkDialogOpen(true)}
                className="md:hidden"
                size="icon"
                variant="outline"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setLinkDialogOpen(true)}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <UserPlus className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold">Vincular Entregador</p>
                    <p className="text-xs text-muted-foreground text-pretty">Vincule um entregador ao seu estabelecimento via CPF</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/estabelecimento/configuracoes")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold">Configurar Entregas</p>
                    <p className="text-xs text-muted-foreground">Gerencie taxas e tempos de entrega</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/estabelecimento/cardapio")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Menu className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold">Gerenciar Cardápio</p>
                    <p className="text-xs text-muted-foreground text-pretty">Atualize seus produtos e preços</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                      <div className="flex items-center gap-3">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(order);
                          }}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <LinkDriverDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          establishmentId={establishment?.id || ""}
          onSuccess={() => {
            fetchOrders(establishment.id);
            toast.success("Entregador vinculado com sucesso!");
          }}
        />
      </main>
    </div>
  );
};

export default EstablishmentDashboard;
