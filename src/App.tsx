import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AddressProvider } from "@/contexts/AddressContext";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EstablishmentAuth from "./pages/auth/EstablishmentAuth";
import DriverAuth from "./pages/auth/DriverAuth";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Categories from "./pages/Categories";
import Restaurants from "./pages/Restaurants";
import EstablishmentDashboard from "./pages/establishment/Dashboard";
import EstablishmentOrders from "./pages/establishment/Orders";
import EstablishmentMenu from "./pages/establishment/Menu";
import EstablishmentSettings from "./pages/establishment/Settings";
import EstablishmentReviews from "./pages/establishment/Reviews";
import EstablishmentPaymentMethods from "./pages/establishment/PaymentMethods";
import EstablishmentCashback from "./pages/establishment/Cashback";
import EstablishmentLoyaltyCard from "./pages/establishment/LoyaltyCard";
import EstablishmentInvoices from "./pages/establishment/Invoices";
import EstablishmentWithdrawals from "./pages/establishment/Withdrawals";
import EstablishmentStatements from "./pages/establishment/Statements";
import EstablishmentBankAccount from "./pages/establishment/BankAccount";
import EstablishmentDeliveryStatements from "./pages/establishment/DeliveryStatements";
import EstablishmentDrivers from "./pages/establishment/Drivers";
import EstablishmentDeliveries from "./pages/establishment/Deliveries";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminEstablishments from "./pages/admin/Establishments";
import AdminCreateEstablishment from "./pages/admin/CreateEstablishment";
import AdminEditEstablishment from "./pages/admin/EditEstablishment";
import AdminUsers from "./pages/admin/Users";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import AdminRegions from "./pages/admin/Regions";
import AdminCoupons from "./pages/admin/Coupons";
import AdminPromotions from "./pages/admin/Promotions";
import AdminInvoices from "./pages/admin/Invoices";
import AdminWithdrawals from "./pages/admin/Withdrawals";
import DriverDashboard from "./pages/driver/Dashboard";
import AvailableOrders from "./pages/driver/AvailableOrders";
import InRoute from "./pages/driver/InRoute";
import DriverHistory from "./pages/driver/History";
import DriverEarnings from "./pages/driver/Earnings";
import DriverSettings from "./pages/driver/Settings";
import OrderTracking from "./pages/OrderTracking";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AboutUs from "./pages/AboutUs";
import { GlobalOrderNotifications } from "./components/GlobalOrderNotifications";

import Restaurant from "./pages/Restaurant";
import Cart from "./pages/Cart";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown) {
      setShowSplash(false);
      setIsReady(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setIsReady(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AddressProvider>
        <CartProvider>
          <TooltipProvider>
            {showSplash && !sessionStorage.getItem("splashShown") && (
              <SplashScreen onComplete={handleSplashComplete} duration={3000} />
            )}
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <GlobalOrderNotifications />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/restaurant/:id" element={<Restaurant />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/estabelecimento/auth" element={<EstablishmentAuth />} />
                <Route path="/entregador/auth" element={<DriverAuth />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/buscar" element={<Search />} />
                <Route path="/categorias" element={<Categories />} />
                <Route path="/categorias/:slug" element={<Categories />} />
                <Route path="/restaurantes" element={<Restaurants />} />
                <Route path="/estabelecimento" element={<EstablishmentDashboard />} />
                <Route path="/estabelecimento/pedidos" element={<EstablishmentOrders />} />
                <Route path="/estabelecimento/cardapio" element={<EstablishmentMenu />} />
                <Route path="/estabelecimento/avaliacoes" element={<EstablishmentReviews />} />
                <Route path="/estabelecimento/pagamentos" element={<EstablishmentPaymentMethods />} />
                <Route path="/estabelecimento/cashback" element={<EstablishmentCashback />} />
                <Route path="/estabelecimento/fidelidade" element={<EstablishmentLoyaltyCard />} />
                <Route path="/estabelecimento/faturas" element={<EstablishmentInvoices />} />
                <Route path="/estabelecimento/saques" element={<EstablishmentWithdrawals />} />
                <Route path="/estabelecimento/extratos" element={<EstablishmentStatements />} />
                <Route path="/estabelecimento/conta-bancaria" element={<EstablishmentBankAccount />} />
                <Route path="/estabelecimento/extrato-entregas" element={<EstablishmentDeliveryStatements />} />
                <Route path="/estabelecimento/entregadores" element={<EstablishmentDrivers />} />
                <Route path="/estabelecimento/entregas" element={<EstablishmentDeliveries />} />
                <Route path="/estabelecimento/configuracoes" element={<EstablishmentSettings />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/estabelecimentos" element={<AdminEstablishments />} />
                <Route path="/admin/estabelecimentos/novo" element={<AdminCreateEstablishment />} />
                <Route path="/admin/estabelecimentos/:id/editar" element={<AdminEditEstablishment />} />
                <Route path="/admin/usuarios" element={<AdminUsers />} />
                <Route path="/admin/regioes" element={<AdminRegions />} />
                <Route path="/admin/cupons" element={<AdminCoupons />} />
                <Route path="/admin/promocoes" element={<AdminPromotions />} />
                <Route path="/admin/faturas" element={<AdminInvoices />} />
                <Route path="/admin/saques" element={<AdminWithdrawals />} />
                <Route path="/admin/relatorios" element={<AdminReports />} />
                <Route path="/admin/relatorios" element={<AdminReports />} />
                <Route path="/admin/configuracoes" element={<AdminSettings />} />
                <Route path="/entregador" element={<DriverDashboard />} />
                <Route path="/entregador/disponiveis" element={<AvailableOrders />} />
                <Route path="/entregador/em-rota" element={<InRoute />} />
                <Route path="/entregador/historico" element={<DriverHistory />} />
                <Route path="/entregador/ganhos" element={<DriverEarnings />} />
                <Route path="/entregador/configuracoes" element={<DriverSettings />} />
                <Route path="/pedido/:orderId" element={<OrderTracking />} />
                <Route path="/instalar" element={<Install />} />
                <Route path="/termos-de-uso" element={<TermsOfUse />} />
                <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
                <Route path="/sobre-nos" element={<AboutUs />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AddressProvider>
    </QueryClientProvider>
  );
};

export default App;
