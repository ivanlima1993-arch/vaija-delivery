import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, Receipt, ArrowUpCircle, ArrowDownCircle, Download } from "lucide-react";

const EstablishmentStatements = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const transactions = [
    { id: 1, date: "02/02/2025", description: "Pedido #1234", type: "credit", value: "R$ 45,90" },
    { id: 2, date: "02/02/2025", description: "Pedido #1233", type: "credit", value: "R$ 32,50" },
    { id: 3, date: "01/02/2025", description: "Saque realizado", type: "debit", value: "R$ 500,00" },
    { id: 4, date: "01/02/2025", description: "Pedido #1232", type: "credit", value: "R$ 78,00" },
    { id: 5, date: "01/02/2025", description: "Taxa da plataforma", type: "debit", value: "R$ 15,00" },
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
              <h1 className="font-bold text-lg">Extratos</h1>
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
                    <ArrowUpCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ 2.580,00</p>
                    <p className="text-sm text-muted-foreground">Entradas (Mês)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <ArrowDownCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ 515,00</p>
                    <p className="text-sm text-muted-foreground">Saídas (Mês)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Receipt className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ 2.065,00</p>
                    <p className="text-sm text-muted-foreground">Saldo (Mês)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Movimentações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        transaction.type === "credit" 
                          ? "bg-green-100 dark:bg-green-900/30" 
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}>
                        {transaction.type === "credit" ? (
                          <ArrowUpCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${
                      transaction.type === "credit" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.type === "credit" ? "+" : "-"}{transaction.value}
                    </p>
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

export default EstablishmentStatements;
