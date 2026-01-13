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
    supportPhone: "(11) 99999-9999",
    autoApproveEstablishments: false,
    emailNotifications: true,
    pushNotifications: true,
    maintenanceMode: false,
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
      fetchPendingEstablishments();
    }
  }, [user, authLoading, isAdmin, navigate]);

  const fetchPendingEstablishments = async () => {
    const { count } = await supabase
      .from("establishments")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false);
    setPendingEstablishments(count || 0);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate saving
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Configurações salvas com sucesso!");
    setSaving(false);
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
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Informações básicas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Nome da Plataforma</Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) =>
                      setSettings({ ...settings, platformName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Email de Suporte</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, supportEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Telefone de Suporte</Label>
                  <Input
                    id="supportPhone"
                    value={settings.supportPhone}
                    onChange={(e) =>
                      setSettings({ ...settings, supportPhone: e.target.value })
                    }
                  />
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
