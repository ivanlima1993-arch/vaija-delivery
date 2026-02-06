import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, TruckIcon, Package, Clock, Download } from "lucide-react";
import { useEstablishment } from "@/hooks/useEstablishment";
import { supabase } from "@/integrations/supabase/client";

const EstablishmentDeliveryStatements = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { establishment, loading } = useEstablishment();
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (establishment) fetchDeliveredOrders();
  }, [establishment]);

  const fetchDeliveredOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("establishment_id", establishment!.id)
      .eq("status", "delivered")
      .order("delivered_at", { ascending: false })
      .limit(50);

    setDeliveredOrders(data || []);
    setLoadingData(false);
  };

  const now = new Date();
  const thisMonth = deliveredOrders.filter(
    (o) => o.delivered_at && new Date(o.delivered_at).getMonth() === now.getMonth() && new Date(o.delivered_at).getFullYear() === now.getFullYear()
  );
  const totalFees = thisMonth.reduce((sum, o) => sum + Number(o.delivery_fee || 0), 0);

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
              <h1 className="font-bold text-lg">Extrato de Entregas</h1>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{thisMonth.length}</p>
                    <p className="text-sm text-muted-foreground">Entregas (Mês)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <TruckIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ {totalFees.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total Taxas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{thisMonth.length > 0 ? "—" : "0"} min</p>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Entregas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : deliveredOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TruckIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma entrega registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveredOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                          <TruckIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Pedido #{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name} • {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString("pt-BR") : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {Number(order.delivery_fee || 0).toFixed(2)}</p>
                        <Badge className="bg-green-500">Entregue</Badge>
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

export default EstablishmentDeliveryStatements;
