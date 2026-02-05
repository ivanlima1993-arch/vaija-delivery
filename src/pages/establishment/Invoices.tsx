import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, FileText, Download, Eye } from "lucide-react";

const EstablishmentInvoices = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const invoices = [
    { id: 1, period: "Janeiro/2025", value: "R$ 150,00", status: "paid", dueDate: "05/02/2025" },
    { id: 2, period: "Dezembro/2024", value: "R$ 150,00", status: "paid", dueDate: "05/01/2025" },
    { id: 3, period: "Novembro/2024", value: "R$ 150,00", status: "paid", dueDate: "05/12/2024" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "overdue":
        return <Badge variant="destructive">Atrasado</Badge>;
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
            <h1 className="font-bold text-lg">Faturas</h1>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Faturas</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma fatura encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.period}</p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {invoice.dueDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">{invoice.value}</p>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
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

export default EstablishmentInvoices;
