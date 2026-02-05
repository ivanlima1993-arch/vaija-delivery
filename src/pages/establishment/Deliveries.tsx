import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, MapPin, Clock, Package, Eye } from "lucide-react";

const EstablishmentDeliveries = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const deliveries = [
    { id: 1, order: "#1234", customer: "Carlos Mendes", address: "Rua A, 123 - Centro", driver: "João Silva", status: "in_transit", time: "15 min" },
    { id: 2, order: "#1233", customer: "Ana Paula", address: "Av. B, 456 - Jardins", driver: "Maria Santos", status: "picking_up", time: "5 min" },
    { id: 3, order: "#1232", customer: "Roberto Lima", address: "Rua C, 789 - Siqueira", driver: null, status: "waiting", time: "Aguardando" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_transit":
        return <Badge className="bg-blue-500">Em Trânsito</Badge>;
      case "picking_up":
        return <Badge className="bg-yellow-500">Retirando</Badge>;
      case "waiting":
        return <Badge variant="secondary">Aguardando</Badge>;
      case "delivered":
        return <Badge className="bg-green-500">Entregue</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <EstablishmentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">Entregas</h1>
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
                    <p className="text-2xl font-bold">2</p>
                    <p className="text-sm text-muted-foreground">Em Andamento</p>
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
                    <p className="text-2xl font-bold">1</p>
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
                    <p className="text-2xl font-bold">45</p>
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
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">Pedido {delivery.order}</p>
                        {getStatusBadge(delivery.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{delivery.customer}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        {delivery.address}
                      </div>
                      {delivery.driver && (
                        <p className="text-sm text-primary mt-1">
                          Entregador: {delivery.driver}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3" />
                          {delivery.time}
                        </div>
                      </div>
                      <Button variant="outline" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentDeliveries;
