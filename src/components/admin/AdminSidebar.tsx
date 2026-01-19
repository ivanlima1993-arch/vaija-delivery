import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Store,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Zap,
  X,
  Shield,
  MapPin,
  Ticket,
  Megaphone,
} from "lucide-react";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  pendingEstablishments?: number;
}

const AdminSidebar = ({ open, onClose, pendingEstablishments = 0 }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin",
    },
    {
      icon: Store,
      label: "Estabelecimentos",
      path: "/admin/estabelecimentos",
      badge: pendingEstablishments > 0 ? pendingEstablishments : undefined,
    },
    {
      icon: Store,
      label: "Novo Estabelecimento",
      path: "/admin/estabelecimentos/novo",
    },
    {
      icon: MapPin,
      label: "Cidades e Regiões",
      path: "/admin/regioes",
    },
    {
      icon: Ticket,
      label: "Cupons",
      path: "/admin/cupons",
    },
    {
      icon: Megaphone,
      label: "Promoções",
      path: "/admin/promocoes",
    },
    {
      icon: Users,
      label: "Usuários",
      path: "/admin/usuarios",
    },
    {
      icon: BarChart3,
      label: "Relatórios",
      path: "/admin/relatorios",
    },
    {
      icon: Settings,
      label: "Configurações",
      path: "/admin/configuracoes",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-primary to-destructive p-1.5 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
            <button className="lg:hidden" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.badge && (
                <Badge variant="destructive" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t space-y-1">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <Zap className="w-5 h-5" />
            Voltar ao Site
          </button>
          <button
            onClick={signOut}
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

export default AdminSidebar;
