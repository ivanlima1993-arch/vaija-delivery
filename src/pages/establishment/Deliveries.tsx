import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, MapPin, Clock, Package, Eye, UserPlus, Printer } from "lucide-react";
import LinkDriverDialog from "@/components/establishment/LinkDriverDialog";
import { useEstablishment } from "@/hooks/useEstablishment";
import { supabase } from "@/integrations/supabase/client";

const EstablishmentDeliveries = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { establishment, loading } = useEstablishment();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  useEffect(() => {
    if (establishment) fetchDeliveryOrders();
  }, [establishment]);

  const fetchDeliveryOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("establishment_id", establishment!.id)
      .in("status", ["ready", "out_for_delivery"])
      .order("created_at", { ascending: false });

    setOrders(data || []);
    setLoadingOrders(false);
  };

  const todayDelivered = orders.filter(
    (o) => o.status === "delivered" && new Date(o.delivered_at).toDateString() === new Date().toDateString()
  ).length;

  const inTransit = orders.filter((o) => o.status === "out_for_delivery").length;
  const waiting = orders.filter((o) => o.status === "ready").length;

  const handlePrint = async (order: any) => {
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
          (item: any) => `
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "out_for_delivery":
        return <Badge className="bg-blue-500">Em Trânsito</Badge>;
      case "ready":
        return <Badge variant="secondary">Aguardando Entregador</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <EstablishmentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg">Entregas</h1>
            </div>
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

        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{inTransit}</p>
                    <p className="text-sm text-muted-foreground">Em Trânsito</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{waiting}</p>
                    <p className="text-sm text-muted-foreground">Aguardando</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{todayDelivered}</p>
                    <p className="text-sm text-muted-foreground">Entregues Hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Entregas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma entrega ativa no momento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">Pedido #{order.order_number}</p>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          {order.delivery_address}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold">R$ {Number(order.total).toFixed(2)}</p>
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
          onSuccess={() => { }}
        />
      </main>
    </div >
  );
};

export default EstablishmentDeliveries;
