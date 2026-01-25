import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

interface EstablishmentSidebarProps {
  open?: boolean;
  onClose?: () => void;
  pendingOrdersCount?: number;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/estabelecimento" },
  { icon: ShoppingBag, label: "Pedidos", path: "/estabelecimento/pedidos" },
  { icon: Package, label: "Cardápio", path: "/estabelecimento/cardapio" },
  { icon: Settings, label: "Configurações", path: "/estabelecimento/configuracoes" },
];

const EstablishmentSidebar = ({ 
  open = true, 
  onClose, 
  pendingOrdersCount = 0 
}: EstablishmentSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Vai Já Delivery" 
                className="h-14 w-auto object-contain animate-logo-pulse"
              />
              <div>
                <span className="font-bold text-lg">Estabelecimento</span>
                <p className="text-xs text-muted-foreground">Painel de Gestão</p>
              </div>
            </div>
            <button className="lg:hidden" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const showBadge = item.path === "/estabelecimento/pedidos" && pendingOrdersCount > 0;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-orange-500 text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {showBadge && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingOrdersCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};

export default EstablishmentSidebar;
