import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  MapPin,
  History,
  Settings,
  LogOut,
  Bike,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/entregador" },
  { icon: Package, label: "Disponíveis", path: "/entregador/disponiveis" },
  { icon: MapPin, label: "Em Rota", path: "/entregador/em-rota" },
  { icon: History, label: "Histórico", path: "/entregador/historico" },
  { icon: Settings, label: "Configurações", path: "/entregador/configuracoes" },
];

const DriverSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="w-64 bg-card border-r min-h-screen p-4 hidden lg:flex flex-col">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Bike className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Entregador</h1>
          <p className="text-xs text-muted-foreground">Painel de Entregas</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="w-5 h-5" />
        Sair
      </Button>
    </aside>
  );
};

export default DriverSidebar;
