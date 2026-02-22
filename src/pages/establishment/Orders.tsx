import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrderNotification } from "@/hooks/useOrderNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import {
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  XCircle,
  ChefHat,
  Truck,
  Package,
  Volume2,
  Menu,
  UserPlus,
  Printer,
} from "lucide-react";
import LinkDriverDialog from "@/components/establishment/LinkDriverDialog";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-yellow-500", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-blue-500", icon: CheckCircle },
  preparing: { label: "Preparando", color: "bg-orange-500", icon: ChefHat },
  ready: { label: "Pronto", color: "bg-green-500", icon: Package },
  out_for_delivery: { label: "Em Entrega", color: "bg-purple-500", icon: Truck },
  delivered: { label: "Entregue", color: "bg-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: XCircle },
};

const EstablishmentOrders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isEstablishment } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // Real-time order notifications
  const { playNotificationSound } = useOrderNotification({
    establishmentId,
    soundEnabled,
    onNewOrder: (order) => {
      setOrders((prev) => [order, ...prev]);
      fetchOrderItems(order.id);
    },
    onOrderUpdate: (order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? order : o))
      );
    },
  });

  useEffect(() => {
    if (!authLoading && (!user || !isEstablishment)) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchEstablishmentAndOrders();
    }
  }, [user, authLoading, isEstablishment, navigate]);

  const fetchEstablishmentAndOrders = async () => {
    try {
      const { data: estab } = await supabase
        .from("establishments")
        .select("id")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (estab) {
        setEstablishmentId(estab.id);
        await fetchOrders(estab.id);
      }
    } catch (error) {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (estabId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("establishment_id", estabId)
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data);
      // Fetch items for all orders
      data.forEach((order) => fetchOrderItems(order.id));
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (data) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const timestampField = {
      confirmed: "confirmed_at",
      preparing: "preparing_at",
      ready: "ready_at",
      out_for_delivery: "out_for_delivery_at",
      delivered: "delivered_at",
      cancelled: "cancelled_at",
    }[newStatus];

    const updateData: any = { status: newStatus };
    if (timestampField) {
      updateData[timestampField] = new Date().toISOString();
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      toast.error("Erro ao atualizar pedido");
    } else {
      toast.success(`Pedido atualizado para: ${statusConfig[newStatus].label}`);
    }
  };

  const filteredOrders = orders.filter((o) =>
    filter === "all" ? true : o.status === filter
  );

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
      ready: "out_for_delivery",
      out_for_delivery: "delivered",
      delivered: null,
      cancelled: null,
    };
    return flow[currentStatus];
  };

  const handlePrint = (order: Order) => {
    const items = orderItems[order.id] || [];
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

  const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-background flex">
      <EstablishmentSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingOrdersCount={pendingOrdersCount}
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
              <h1 className="font-bold text-lg">Pedidos</h1>
            </div>
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) {
                  playNotificationSound();
                }
              }}
              className={`p-2 rounded-lg transition-colors ${soundEnabled ? "hover:bg-muted" : "bg-muted/50 text-muted-foreground"
                }`}
              title={soundEnabled ? "Som ativado" : "Som desativado"}
            >
              <Volume2 className={`w-5 h-5 ${!soundEnabled ? "opacity-50" : ""}`} />
            </button>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setLinkDialogOpen(true)}
                className="hidden sm:flex gap-2"
                size="sm"
              >
                <UserPlus className="w-4 h-4" />
                Vincular Entregador
              </Button>
              <Button
                onClick={() => setLinkDialogOpen(true)}
                className="sm:hidden"
                size="icon"
                variant="outline"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Todos ({orders.length})
            </Button>
            {(Object.keys(statusConfig) as OrderStatus[]).map((status) => {
              const count = orders.filter((o) => o.status === status).length;
              return (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className="whitespace-nowrap"
                >
                  {statusConfig[status].label} ({count})
                </Button>
              );
            })}
          </div>

          {/* Orders Grid */}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status].icon;
                const items = orderItems[order.id] || [];
                const nextStatus = getNextStatus(order.status);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <Card
                      className={`cursor-pointer transition-shadow hover:shadow-lg ${order.status === "pending" ? "border-yellow-500 border-2" : ""
                        }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Pedido #{order.order_number}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusConfig[order.status].color} text-white`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[order.status].label}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrint(order);
                              }}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          {order.customer_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(order.created_at).toLocaleString("pt-BR")}
                        </div>

                        {/* Items Preview */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          {items.slice(0, 2).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.quantity}x {item.product_name}
                              </span>
                              <span className="text-muted-foreground">
                                R$ {Number(item.subtotal).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {items.length > 2 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              +{items.length - 2} itens
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-bold text-lg text-primary">
                            R$ {Number(order.total).toFixed(2)}
                          </span>
                          {nextStatus && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, nextStatus);
                              }}
                            >
                              {statusConfig[nextStatus].label}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhum pedido encontrado</p>
            </div>
          )}
        </div>
      </main>
      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    Pedido #{selectedOrder.order_number}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePrint(selectedOrder)}
                      title="Imprimir Pedido"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Badge
                      className={`${statusConfig[selectedOrder.status].color} text-white`}
                    >
                      {statusConfig[selectedOrder.status].label}
                    </Badge>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5" />
                    <span>{selectedOrder.delivery_address}</span>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold mb-2">Itens do Pedido</h3>
                  <div className="space-y-2">
                    {(orderItems[selectedOrder.id] || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center bg-muted/30 rounded-lg p-3"
                      >
                        <div>
                          <span className="font-medium">
                            {item.quantity}x {item.product_name}
                          </span>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground">{item.notes}</p>
                          )}
                        </div>
                        <span className="font-medium">
                          R$ {Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Observações:
                    </p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R$ {Number(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega</span>
                    <span>R$ {Number(selectedOrder.delivery_fee).toFixed(2)}</span>
                  </div>
                  {Number(selectedOrder.discount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto</span>
                      <span>-R$ {Number(selectedOrder.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">
                      R$ {Number(selectedOrder.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  {selectedOrder.status === "pending" && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, "cancelled");
                        setSelectedOrder(null);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Recusar
                    </Button>
                  )}
                  {getNextStatus(selectedOrder.status) && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        updateOrderStatus(
                          selectedOrder.id,
                          getNextStatus(selectedOrder.status)!
                        );
                        setSelectedOrder(null);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {statusConfig[getNextStatus(selectedOrder.status)!].label}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <LinkDriverDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        establishmentId={establishmentId || ""}
        onSuccess={() => {
          toast.success("Entregador vinculado com sucesso!");
        }}
      />
    </div >
  );
};

export default EstablishmentOrders;
