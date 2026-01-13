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
import EstablishmentDashboard from "./pages/establishment/Dashboard";
import EstablishmentOrders from "./pages/establishment/Orders";
import EstablishmentMenu from "./pages/establishment/Menu";
import EstablishmentSettings from "./pages/establishment/Settings";
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
            <Route path="/estabelecimento" element={<EstablishmentDashboard />} />
            <Route path="/estabelecimento/pedidos" element={<EstablishmentOrders />} />
            <Route path="/estabelecimento/cardapio" element={<EstablishmentMenu />} />
            <Route path="/estabelecimento/configuracoes" element={<EstablishmentSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
