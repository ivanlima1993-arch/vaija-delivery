import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Restaurant from "./pages/Restaurant";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import EstablishmentDashboard from "./pages/establishment/Dashboard";
import EstablishmentOrders from "./pages/establishment/Orders";
import EstablishmentMenu from "./pages/establishment/Menu";
import EstablishmentSettings from "./pages/establishment/Settings";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminEstablishments from "./pages/admin/Establishments";
import AdminUsers from "./pages/admin/Users";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import DriverDashboard from "./pages/driver/Dashboard";
import AvailableOrders from "./pages/driver/AvailableOrders";
import InRoute from "./pages/driver/InRoute";
import DriverHistory from "./pages/driver/History";
import DriverSettings from "./pages/driver/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/restaurant/:id" element={<Restaurant />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/estabelecimento" element={<EstablishmentDashboard />} />
            <Route path="/estabelecimento/pedidos" element={<EstablishmentOrders />} />
            <Route path="/estabelecimento/cardapio" element={<EstablishmentMenu />} />
            <Route path="/estabelecimento/configuracoes" element={<EstablishmentSettings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/estabelecimentos" element={<AdminEstablishments />} />
            <Route path="/admin/usuarios" element={<AdminUsers />} />
            <Route path="/admin/relatorios" element={<AdminReports />} />
            <Route path="/admin/configuracoes" element={<AdminSettings />} />
            <Route path="/entregador" element={<DriverDashboard />} />
            <Route path="/entregador/disponiveis" element={<AvailableOrders />} />
            <Route path="/entregador/em-rota" element={<InRoute />} />
            <Route path="/entregador/historico" element={<DriverHistory />} />
            <Route path="/entregador/configuracoes" element={<DriverSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
