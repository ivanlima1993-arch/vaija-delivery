import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Menu,
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
} from "lucide-react";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingEstablishments, setPendingEstablishments] = useState(0);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    platformName: "VAIJÁ",
    supportEmail: "suporte@vaija.com.br",
    supportPhone: "(11) 99912-3456",
    autoApproveEstablishments: false,
    emailNotifications: true,
    pushNotifications: true,
    maintenanceMode: false,
  });

  const [supportSettings, setSupportSettings] = useState({
    whatsapp: "5579988320546",
    email: "suporte@vaijadelivery.com",
    chatUrl: "",
    days: ["1", "2", "3", "4", "5"], // 1-5 (Seg-Sex)
    startTime: "08:00",
    endTime: "22:00",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user && !isAdmin) {
      toast.error("Acesso negado. Área restrita para administradores.");
      navigate("/");
      return;
    }

    if (user && isAdmin) {
      fetchSettings();
      fetchPendingEstablishments();
    }
  }, [user, authLoading, isAdmin, navigate]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      if (data) {
        const platform = data.find(s => s.key === "general");
        const support = data.find(s => s.key === "support");

        if (platform) setSettings(prev => ({ ...prev, ...platform.value }));
        if (support) setSupportSettings(prev => ({ ...prev, ...support.value }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const fetchPendingEstablishments = async () => {
    const { count } = await supabase
      .from("establishments")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false);
    setPendingEstablishments(count || 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save General Settings
      const { error: genError } = await supabase
        .from("site_settings")
        .upsert({
          key: "general",
          value: settings,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });

      // Save Support Settings
      const { error: supError } = await supabase
        .from("site_settings")
        .upsert({
          key: "support",
          value: supportSettings,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });

      if (genError || supError) {
        throw genError || supError;
      }

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar. Verifique se a tabela 'site_settings' existe.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingEstablishments={pendingEstablishments}
      />

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
              <div>
                <h1 className="font-bold text-lg">Configurações</h1>
                <p className="text-sm text-muted-foreground">
                  Configurações gerais da plataforma
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
          {/* Support Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Suporte
              </CardTitle>
              <CardDescription>
                Defina como e quando os usuários podem entrar em contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp de Suporte</Label>
                  <Input
                    id="whatsapp"
                    placeholder="Ex: 5579988320546"
                    value={supportSettings.whatsapp}
                    onChange={(e) =>
                      setSupportSettings({ ...supportSettings, whatsapp: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Email de Atendimento</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    placeholder="suporte@exemplo.com"
                    value={supportSettings.email}
                    onChange={(e) =>
                      setSupportSettings({ ...supportSettings, email: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="chatUrl">Link do Chat Online (Ex: Tawk.to)</Label>
                  <Input
                    id="chatUrl"
                    placeholder="https://tawk.to/chat/..."
                    value={supportSettings.chatUrl}
                    onChange={(e) =>
                      setSupportSettings({ ...supportSettings, chatUrl: e.target.value })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-sm">Horário de Atendimento</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Dias de Atendimento</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Dom", value: "0" },
                        { label: "Seg", value: "1" },
                        { label: "Ter", value: "2" },
                        { label: "Qua", value: "3" },
                        { label: "Qui", value: "4" },
                        { label: "Sex", value: "5" },
                        { label: "Sáb", value: "6" },
                      ].map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={supportSettings.days.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-10 p-0"
                          onClick={() => {
                            const newDays = supportSettings.days.includes(day.value)
                              ? supportSettings.days.filter((d) => d !== day.value)
                              : [...supportSettings.days, day.value];
                            setSupportSettings({ ...supportSettings, days: newDays });
                          }}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="start">Abertura</Label>
                      <Input
                        id="start"
                        type="time"
                        value={supportSettings.startTime}
                        onChange={(e) =>
                          setSupportSettings({ ...supportSettings, startTime: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="end">Fechamento</Label>
                      <Input
                        id="end"
                        type="time"
                        value={supportSettings.endTime}
                        onChange={(e) =>
                          setSupportSettings({ ...supportSettings, endTime: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Aprovações
              </CardTitle>
              <CardDescription>
                Configure como os estabelecimentos são aprovados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aprovação Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Aprovar automaticamente novos estabelecimentos
                  </p>
                </div>
                <Switch
                  checked={settings.autoApproveEstablishments}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoApproveEstablishments: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure as notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações importantes por email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações push no navegador
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, pushNotifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Mode */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Settings className="w-5 h-5" />
                Modo de Manutenção
              </CardTitle>
              <CardDescription>
                Ativar o modo de manutenção irá desabilitar o acesso público à plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Apenas administradores terão acesso
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, maintenanceMode: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
