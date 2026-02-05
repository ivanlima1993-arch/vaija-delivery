import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, TruckIcon, Package, Clock, Download } from "lucide-react";

const EstablishmentDeliveryStatements = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const deliveries = [
    { id: 1, date: "02/02/2025", order: "#1234", driver: "João Silva", fee: "R$ 8,00", status: "delivered" },
    { id: 2, date: "02/02/2025", order: "#1233", driver: "Maria Santos", fee: "R$ 10,00", status: "delivered" },
    { id: 3, date: "01/02/2025", order: "#1232", driver: "João Silva", fee: "R$ 8,00", status: "delivered" },
    { id: 4, date: "01/02/2025", order: "#1231", driver: "Pedro Lima", fee: "R$ 12,00", status: "delivered" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <EstablishmentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
              <h1 className="font-bold text-lg">Extrato de Entregas</h1>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
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
                    <p className="text-2xl font-bold">156</p>
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
                    <p className="text-2xl font-bold">R$ 1.480,00</p>
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
                    <p className="text-2xl font-bold">28 min</p>
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
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <TruckIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Pedido {delivery.order}</p>
                        <p className="text-sm text-muted-foreground">
                          {delivery.driver} • {delivery.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{delivery.fee}</p>
                      <Badge className="bg-green-500">Entregue</Badge>
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

export default EstablishmentDeliveryStatements;
