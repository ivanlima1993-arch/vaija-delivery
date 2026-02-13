import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Phone,
  Mail,
  Bell,
  Shield,
  Menu,
  Settings,
  Bike,
  Save,
} from "lucide-react";
import { motion } from "framer-motion";
import DriverSidebar from "@/components/driver/DriverSidebar";

interface Profile {
  full_name: string;
  phone: string;
}

const DriverSettings = () => {
  const navigate = useNavigate();
  const { user, isDriver, loading: authLoading, signOut, isDriverApproved } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    phone: "",
  });
  const [notifications, setNotifications] = useState({
    newOrders: true,
    sound: true,
  });

  useEffect(() => {
    if (!authLoading && (!user || !isDriver)) {
      navigate("/entregador/auth");
      return;
    }

    if (!authLoading && user && isDriver && !isDriverApproved) {
      navigate("/entregador");
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, isDriver, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
        });
      }
    } catch (error) {
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user!.id,
          full_name: profile.full_name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;
      toast.success("Perfil salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/entregador/auth");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-muted rounded-lg lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-600" />
                <h1 className="font-bold text-lg">Configurações</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    Perfil do Entregador
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Bike className="w-12 h-12 text-green-600" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          className="pl-10"
                          placeholder="Seu nome"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="pl-10"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={user?.email || ""}
                          disabled
                          className="pl-10 bg-muted"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={saveProfile}
                      disabled={saving}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-green-600" />
                    Notificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Novos Pedidos</p>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações de novos pedidos
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newOrders}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, newOrders: checked })
                      }
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Som</p>
                      <p className="text-sm text-muted-foreground">
                        Reproduzir som ao receber notificações
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sound}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, sound: checked })
                      }
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    Sair da Conta
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverSettings;
