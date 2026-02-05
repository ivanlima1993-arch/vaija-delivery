import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, Wallet, ArrowDownCircle, Clock, CheckCircle } from "lucide-react";

const EstablishmentWithdrawals = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const withdrawals = [
    { id: 1, date: "28/01/2025", value: "R$ 500,00", status: "completed" },
    { id: 2, date: "15/01/2025", value: "R$ 750,00", status: "completed" },
    { id: 3, date: "02/01/2025", value: "R$ 300,00", status: "completed" },
  ];

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
            <h1 className="font-bold text-lg">Saques</h1>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ 1.250,00</p>
                    <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ 0,00</p>
                    <p className="text-sm text-muted-foreground">Em Processamento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Solicitar Saque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor do Saque</label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="R$ 0,00"
                />
              </div>
              <Button className="w-full">
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Solicitar Saque
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Saques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{withdrawal.value}</p>
                        <p className="text-sm text-muted-foreground">{withdrawal.date}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">Concluído</Badge>
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

export default EstablishmentWithdrawals;
