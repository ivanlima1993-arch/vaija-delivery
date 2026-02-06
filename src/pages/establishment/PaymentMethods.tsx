import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { CreditCard, Menu, Banknote, QrCode, Wallet } from "lucide-react";
import { useEstablishment } from "@/hooks/useEstablishment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_METHODS = [
  { key: "pix", icon: QrCode, name: "PIX", description: "Pagamento instantâneo" },
  { key: "credit_card", icon: CreditCard, name: "Cartão de Crédito", description: "Visa, Mastercard, Elo" },
  { key: "debit_card", icon: CreditCard, name: "Cartão de Débito", description: "Todas as bandeiras" },
  { key: "cash", icon: Banknote, name: "Dinheiro", description: "Pagamento na entrega" },
  { key: "wallet", icon: Wallet, name: "Carteira Digital", description: "PicPay, Mercado Pago" },
];

const EstablishmentPaymentMethods = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { establishment, loading } = useEstablishment();
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean>>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (establishment) fetchPaymentMethods();
  }, [establishment]);

  const fetchPaymentMethods = async () => {
    const { data } = await supabase
      .from("establishment_payment_methods")
      .select("*")
      .eq("establishment_id", establishment!.id);

    if (data && data.length > 0) {
      const map: Record<string, boolean> = {};
      data.forEach((m) => { map[m.method_key] = m.is_enabled; });
      setEnabledMethods(map);
    } else {
      // Initialize defaults
      const defaults: Record<string, boolean> = {};
      DEFAULT_METHODS.forEach((m) => { defaults[m.key] = m.key !== "wallet"; });
      setEnabledMethods(defaults);
      
      // Insert defaults
      const inserts = DEFAULT_METHODS.map((m) => ({
        establishment_id: establishment!.id,
        method_key: m.key,
        method_name: m.name,
        description: m.description,
        is_enabled: m.key !== "wallet",
      }));
      await supabase.from("establishment_payment_methods").insert(inserts);
    }
    setLoadingData(false);
  };

  const toggleMethod = async (key: string) => {
    const newValue = !enabledMethods[key];
    setEnabledMethods((prev) => ({ ...prev, [key]: newValue }));

    const { error } = await supabase
      .from("establishment_payment_methods")
      .update({ is_enabled: newValue })
      .eq("establishment_id", establishment!.id)
      .eq("method_key", key);

    if (error) {
      toast.error("Erro ao atualizar método de pagamento");
      setEnabledMethods((prev) => ({ ...prev, [key]: !newValue }));
    }
  };

  if (loading || loadingData) {
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
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
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
              {DEFAULT_METHODS.map((method) => (
                <div key={method.key} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <method.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={enabledMethods[method.key] ?? false}
                    onCheckedChange={() => toggleMethod(method.key)}
                  />
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
