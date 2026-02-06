import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, Users, Star, MapPin } from "lucide-react";
import { useEstablishment } from "@/hooks/useEstablishment";
import { supabase } from "@/integrations/supabase/client";

interface DriverInfo {
  driver_id: string;
  name: string;
  deliveries: number;
  isActive: boolean;
}

const EstablishmentDrivers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { establishment, loading } = useEstablishment();
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (establishment) fetchDrivers();
  }, [establishment]);

  const fetchDrivers = async () => {
    // Get unique drivers from delivered orders for this establishment
    const { data: orders } = await supabase
      .from("orders")
      .select("driver_id, customer_name, status")
      .eq("establishment_id", establishment!.id)
      .not("driver_id", "is", null);

    if (!orders || orders.length === 0) {
      setDrivers([]);
      setLoadingData(false);
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
    setLoadingData(false);
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
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">Entregadores</h1>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{drivers.length}</p>
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
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{drivers.reduce((s, d) => s + d.deliveries, 0)}</p>
                    <p className="text-sm text-muted-foreground">Total Entregas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Entregadores</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum entregador registrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drivers.map((driver) => (
                    <div key={driver.driver_id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{driver.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-muted-foreground">{driver.deliveries} entregas</p>
                        </div>
                      </div>
                      <Badge className={driver.isActive ? "bg-blue-500" : "bg-muted text-muted-foreground"}>
                        {driver.isActive ? "Em Entrega" : "Disponível"}
                      </Badge>
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

export default EstablishmentDrivers;
