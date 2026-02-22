import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, Users, Star, MapPin, UserPlus, Trash2, Settings } from "lucide-react";
import { useEstablishment } from "@/hooks/useEstablishment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LinkDriverDialog from "@/components/establishment/LinkDriverDialog";

interface DriverInfo {
  driver_id: string;
  name: string;
  deliveries: number;
  isActive: boolean;
  isLinked?: boolean;
}

const EstablishmentDrivers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { establishment, loading } = useEstablishment();
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [linkedDrivers, setLinkedDrivers] = useState<DriverInfo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [ownDeliveryEnabled, setOwnDeliveryEnabled] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (establishment) {
      fetchData();
      fetchSettings();
    }
  }, [establishment]);

  const fetchSettings = async () => {
    if (!establishment) return;

    try {
      const { data, error } = await supabase
        .from("establishment_settings")
        .select("own_delivery_enabled")
        .eq("establishment_id", establishment.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      if (data) {
        setOwnDeliveryEnabled(data.own_delivery_enabled || false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleOwnDelivery = async (enabled: boolean) => {
    if (!establishment) return;

    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from("establishment_settings")
        .upsert({
          establishment_id: establishment.id,
          own_delivery_enabled: enabled
        }, { onConflict: "establishment_id" });

      if (error) throw error;

      setOwnDeliveryEnabled(enabled);
      toast.success(enabled ? "Entregas próprias ativadas" : "Entregas próprias desativadas");
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error("Erro ao atualizar configuração. Verifique se a coluna own_delivery_enabled existe na tabela establishment_settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchData = async () => {
    setLoadingData(true);
    await Promise.all([fetchDrivers(), fetchLinkedDrivers()]);
    setLoadingData(false);
  };

  const fetchDrivers = async () => {
    // Get unique drivers from delivered orders for this establishment
    const { data: orders } = await supabase
      .from("orders")
      .select("driver_id, status")
      .eq("establishment_id", establishment!.id)
      .not("driver_id", "is", null);

    if (!orders || orders.length === 0) {
      setDrivers([]);
      return;
    }

    // Group by driver_id
    const driverMap = new Map<string, { count: number; hasActive: boolean }>();
    orders.forEach((o) => {
      if (!o.driver_id) return;
      const existing = driverMap.get(o.driver_id) || { count: 0, hasActive: false };
      existing.count++;
      if (o.status === "out_for_delivery") existing.hasActive = true;
      driverMap.set(o.driver_id, existing);
    });

    // Get driver profiles
    const driverIds = Array.from(driverMap.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", driverIds);

    const driverList: DriverInfo[] = driverIds.map((id) => {
      const profile = profiles?.find((p) => p.user_id === id);
      const info = driverMap.get(id)!;
      return {
        driver_id: id,
        name: profile?.full_name || "Entregador",
        deliveries: info.count,
        isActive: info.hasActive,
      };
    });

    driverList.sort((a, b) => b.deliveries - a.deliveries);
    setDrivers(driverList);
  };

  const fetchLinkedDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from("establishment_drivers")
        .select(`
          driver_id,
          profiles:driver_id (full_name)
        `)
        .eq("establishment_id", establishment!.id)
        .eq("status", "active");

      if (error) {
        console.warn("Table establishment_drivers may not exist yet or error fetching:", error.message);
        return;
      }

      const list: DriverInfo[] = (data || []).map((d: any) => ({
        driver_id: d.driver_id,
        name: d.profiles?.full_name || "Entregador",
        deliveries: 0, // We could fetch this too but keeping it simple
        isActive: false,
        isLinked: true
      }));

      setLinkedDrivers(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlinkDriver = async (driverId: string) => {
    if (!establishment) return;

    try {
      const { error } = await supabase
        .from("establishment_drivers")
        .delete()
        .eq("establishment_id", establishment.id)
        .eq("driver_id", driverId);

      if (error) throw error;

      toast.success("Entregador desvinculado");
      fetchLinkedDrivers();
    } catch (error: any) {
      toast.error("Erro ao desvincular entregador");
    }
  };

  const onlineCount = drivers.filter((d) => d.isActive).length;

  if (loading) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg">Entregadores</h1>
            </div>
            <Button onClick={() => setLinkDialogOpen(true)} className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Vincular Entregador</span>
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{drivers.length + linkedDrivers.filter(ld => !drivers.some(d => d.driver_id === ld.driver_id)).length}</p>
                    <p className="text-sm text-muted-foreground">Total Entregadores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{onlineCount}</p>
                    <p className="text-sm text-muted-foreground">Em Entrega</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-1">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                      <Settings className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Entregas Próprias</p>
                      <p className="text-xs text-muted-foreground">Usar apenas entregadores vinculados</p>
                    </div>
                  </div>
                  <Switch
                    checked={ownDeliveryEnabled}
                    onCheckedChange={handleToggleOwnDelivery}
                    disabled={savingSettings}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entregadores Vinculados</CardTitle>
                <CardDescription>Entregadores que você vinculou manualmente via CPF</CardDescription>
              </CardHeader>
              <CardContent>
                {linkedDrivers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                    <p className="text-sm">Nenhum entregador vinculado ainda.</p>
                    <Button variant="link" size="sm" onClick={() => setLinkDialogOpen(true)}>
                      Vincule o primeiro agora
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedDrivers.map((driver) => (
                      <div key={driver.driver_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{driver.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">{driver.name}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleUnlinkDriver(driver.driver_id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Entregadores</CardTitle>
                <CardDescription>Entregadores que já realizaram entregas para você</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                    <p className="text-sm">Nenhum histórico de entregas encontrado.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drivers.map((driver) => (
                      <div key={driver.driver_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{driver.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{driver.name}</p>
                            <p className="text-[10px] text-muted-foreground">{driver.deliveries} entregas realizadas</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={driver.isActive ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-muted text-muted-foreground"}>
                          {driver.isActive ? "Em Entrega" : "Livre"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <LinkDriverDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          establishmentId={establishment?.id || ""}
          onSuccess={fetchLinkedDrivers}
        />
      </main>
    </div>
  );
};

export default EstablishmentDrivers;
