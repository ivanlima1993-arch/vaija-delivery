import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, Gift, Users, Award } from "lucide-react";
import { useEstablishment } from "@/hooks/useEstablishment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EstablishmentLoyaltyCard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { establishment, loading } = useEstablishment();
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [stampsRequired, setStampsRequired] = useState("10");
  const [rewardDescription, setRewardDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (establishment) fetchSettings();
  }, [establishment]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("establishment_settings")
      .select("*")
      .eq("establishment_id", establishment!.id)
      .maybeSingle();

    if (data) {
      setLoyaltyEnabled(data.loyalty_enabled);
      setStampsRequired(String(data.loyalty_stamps_required));
      setRewardDescription(data.loyalty_reward_description || "");
    }
    setLoadingData(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from("establishment_settings")
      .select("id")
      .eq("establishment_id", establishment!.id)
      .maybeSingle();

    const payload = {
      establishment_id: establishment!.id,
      loyalty_enabled: loyaltyEnabled,
      loyalty_stamps_required: Number(stampsRequired) || 10,
      loyalty_reward_description: rewardDescription,
    };

    let error;
    if (existing) {
      ({ error } = await supabase.from("establishment_settings").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("establishment_settings").insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas!");
    }
    setSaving(false);
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
            <h1 className="font-bold text-lg">Cartão Fidelidade</h1>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Gift className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stampsRequired}</p>
                    <p className="text-sm text-muted-foreground">Selos para Prêmio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{loyaltyEnabled ? "Ativo" : "Inativo"}</p>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Prêmios Resgatados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configurações do Cartão Fidelidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ativar Cartão Fidelidade</p>
                  <p className="text-sm text-muted-foreground">Clientes ganham selos a cada compra</p>
                </div>
                <Switch checked={loyaltyEnabled} onCheckedChange={setLoyaltyEnabled} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Selos para Prêmio</label>
                <Input
                  type="number"
                  value={stampsRequired}
                  onChange={(e) => setStampsRequired(e.target.value)}
                  placeholder="10"
                  min="5"
                  max="20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição do Prêmio</label>
                <Input
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  placeholder="Ex: 1 lanche grátis"
                />
              </div>
              <Button className="w-full" onClick={saveSettings} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentLoyaltyCard;
