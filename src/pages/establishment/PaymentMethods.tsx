import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { CreditCard, Menu, Banknote, QrCode, Wallet } from "lucide-react";

const EstablishmentPaymentMethods = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const paymentMethods = [
    { id: "pix", icon: QrCode, name: "PIX", description: "Pagamento instantâneo", enabled: true },
    { id: "credit", icon: CreditCard, name: "Cartão de Crédito", description: "Visa, Mastercard, Elo", enabled: true },
    { id: "debit", icon: CreditCard, name: "Cartão de Débito", description: "Todas as bandeiras", enabled: true },
    { id: "cash", icon: Banknote, name: "Dinheiro", description: "Pagamento na entrega", enabled: true },
    { id: "wallet", icon: Wallet, name: "Carteira Digital", description: "PicPay, Mercado Pago", enabled: false },
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
            <h1 className="font-bold text-lg">Formas de Pagamento</h1>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos Aceitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <method.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                  <Switch checked={method.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentPaymentMethods;
