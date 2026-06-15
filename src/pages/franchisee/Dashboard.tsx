import { useState, useEffect } from "react";
import { 
  DollarSign, 
  Users, 
  Store, 
  TrendingUp, 
  Bell, 
  Search, 
  Plus, 
  MapPin, 
  Tag, 
  BarChart3, 
  Building2, 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  Trash2, 
  Loader2,
  Pencil,
  Calendar as CalendarIcon,
  Package,
  Home,
  Wrench,
  ShieldCheck,
  Menu,
  Bike
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { NewCouponDialog } from "@/components/franchisee/NewCouponDialog";
import { NewLeadDialog } from "@/components/franchisee/NewLeadDialog";

const FranchiseeDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);

  // Analytics State
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // Auth Protection
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "franchisee")
        .single();

      if (!roles) {
        toast.error("Acesso negado: Você não tem permissão de franqueado.");
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  // Real-time Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('franchisee-dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["franchisee-orders"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'establishments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["franchisee-establishments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ─── Queries ───────────────────────────────────────────────────────────────

  // 1. Get current franchisee data
  const { data: franchisee, isLoading: loadingFranchisee } = useQuery({
    queryKey: ["current-franchisee"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("franchisees")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // 2. Get managed cities
  const { data: cities = [] } = useQuery({
    queryKey: ["franchisee-cities", franchisee?.user_id],
    enabled: !!franchisee,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("franchisee_id", franchisee.user_id);
      if (error) throw error;
      return data;
    }
  });

  const cityIds = cities.map(c => c.id);
  const cityNames = cities.map(c => c.name);

  // 3. Get establishments in these cities
  const { data: establishments = [], isLoading: loadingEst } = useQuery({
    queryKey: ["franchisee-establishments", cityIds],
    enabled: cityIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .in("city_id", cityIds);
      if (error) throw error;
      return data;
    }
  });

  // 4. Get orders for these establishments
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["franchisee-orders", establishments.map(e => e.id)],
    enabled: establishments.length > 0,
    queryFn: async () => {
      const estIds = establishments.map(e => e.id);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("establishment_id", estIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // 5. Get Prospects (Local Leads)
  const { data: prospects = [] } = useQuery({
    queryKey: ["franchisee-prospects", cityNames],
    enabled: cityNames.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .in("city", cityNames);
      if (error) throw error;
      return data;
    }
  });

  // 6. Get Regional Coupons
  const { data: coupons = [] } = useQuery({
    queryKey: ["franchisee-coupons", cityIds],
    enabled: cityIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .in("city_id", cityIds);
      if (error) throw error;
      return data;
    }
  });

  // ─── Calculations ──────────────────────────────────────────────────────────

  const filteredOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at);
    return isWithinInterval(orderDate, { start: dateRange.from, end: dateRange.to });
  });

  const totalRevenue = filteredOrders
    .filter(o => o.status === 'delivered')
    .reduce((acc, current) => acc + Number(current.total), 0);
  
  const commission = totalRevenue * ((franchisee?.commission_rate || 5) / 100);

  // Chart data (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "dd/MM");
    const dailyTotal = orders
      .filter(o => o.status === 'delivered' && format(new Date(o.created_at), "dd/MM") === dateStr)
      .reduce((acc, curr) => acc + Number(curr.total), 0);
    
    return {
      name: dateStr,
      vendas: dailyTotal,
      lucro: dailyTotal * ((franchisee?.commission_rate || 5) / 100)
    };
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleEst = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ is_open: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      toast.success("Status atualizado!");
    } catch (e) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = `Olá ${name}! Somos da equipe Vai Já Delivery. Como podemos ajudar hoje?`;
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/auth");
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loadingFranchisee || loadingEst || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-10">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display font-bold text-xl text-primary">Painel do Franqueado</h1>
            <div className="hidden md:flex gap-2">
              {cities.map(city => (
                <span key={city.id} className="inline-flex px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {city.name} - {city.state}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            </Button>
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              F
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Olá, {franchisee?.name || "Franqueado"}</h2>
            <p className="text-muted-foreground">Gerencie o crescimento da rede em sua região.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range: any) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-soft overflow-hidden">
            <div className="h-1 bg-blue-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento (Período)</CardTitle>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">
                {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-success flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft overflow-hidden">
            <div className="h-1 bg-emerald-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sua Comissão ({franchisee?.commission_rate || 5}%)</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600">
                {commission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estimativa de lucro bruto
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estabelecimentos</CardTitle>
              <Store className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{establishments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {establishments.filter(e => e.is_approved).length} aprovados
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft overflow-hidden">
            <div className="h-1 bg-amber-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leads Regionais</CardTitle>
              <Users className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{prospects.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Potenciais parceiros locais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary hover:bg-primary/95 text-white cursor-pointer transition-all shadow-lg shadow-primary/20 group" onClick={() => navigate("/franqueado/pedidos")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
                <TrendingUp className="w-4 h-4 text-white/60 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <h3 className="font-bold text-lg">Pedidos Regionais</h3>
              <p className="text-white/70 text-sm">Gerencie todos os pedidos da sua região em tempo real.</p>
            </CardContent>
          </Card>

          <Card className="bg-white hover:bg-muted/50 cursor-pointer transition-all border-none shadow-soft group" onClick={() => setCouponDialogOpen(true)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Tag className="w-6 h-6" />
                </div>
                <Plus className="w-4 h-4 text-muted-foreground group-hover:rotate-90 transition-transform" />
              </div>
              <h3 className="font-bold text-lg">Criar Cupom</h3>
              <p className="text-muted-foreground text-sm">Gere cupons de desconto para alavancar suas cidades.</p>
            </CardContent>
          </Card>

          <Card className="bg-white hover:bg-muted/50 cursor-pointer transition-all border-none shadow-soft group" onClick={() => navigate("/franqueado/promocoes")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                  <Bell className="w-6 h-6" />
                </div>
                <Plus className="w-4 h-4 text-muted-foreground group-hover:rotate-90 transition-transform" />
              </div>
              <h3 className="font-bold text-lg">Marketing & Banners</h3>
              <p className="text-muted-foreground text-sm">Configure banners promocionais regionalizados.</p>
            </CardContent>
          </Card>

          <Card className="bg-white hover:bg-muted/50 cursor-pointer transition-all border-none shadow-soft group" onClick={() => setLeadDialogOpen(true)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Users className="w-6 h-6" />
                </div>
                <Plus className="w-4 h-4 text-muted-foreground group-hover:rotate-90 transition-transform" />
              </div>
              <h3 className="font-bold text-lg">Novo Lead (CRM)</h3>
              <p className="text-muted-foreground text-sm">Capture novos parceiros e gerencie sua expansão.</p>
            </CardContent>
          </Card>

          <Card className="bg-white hover:bg-muted/50 cursor-pointer transition-all border-none shadow-soft group" onClick={() => navigate("/franqueado/corretores")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <h3 className="font-bold text-lg">Gestão de Corretores</h3>
              <p className="text-muted-foreground text-sm">Aprovação e controle regional de corretores.</p>
            </CardContent>
          </Card>

          <Card className="bg-white hover:bg-muted/50 cursor-pointer transition-all border-none shadow-soft group" onClick={() => navigate("/franqueado/servicos")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-600">
                  <Wrench className="w-6 h-6" />
                </div>
                <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <h3 className="font-bold text-lg">Gestão de Serviços</h3>
              <p className="text-muted-foreground text-sm">Controle de profissionais e serviços locais.</p>
            </CardContent>
          </Card>

          <Card className="bg-white hover:bg-muted/50 cursor-pointer transition-all border-none shadow-soft group" onClick={() => navigate("/franqueado/entregadores")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                  <Bike className="w-6 h-6" />
                </div>
                <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <h3 className="font-bold text-lg">Gestão de Entregadores</h3>
              <p className="text-muted-foreground text-sm">Aprovação e controle regional de entregadores.</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1 gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="establishments" className="gap-2">
              <Store className="w-4 h-4" /> Estabelecimentos
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2">
              <Tag className="w-4 h-4" /> Cupons Locais
            </TabsTrigger>
            <TabsTrigger value="prospects" className="gap-2">
              <Users className="w-4 h-4" /> CRM / Leads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-soft">
                <CardHeader>
                  <CardTitle>Vendas nos últimos 7 dias</CardTitle>
                  <CardDescription>Volume total de pedidos realizados na região</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1}/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, "Vendas"]}
                      />
                      <Area type="monotone" dataKey="vendas" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-soft">
                <CardHeader>
                  <CardTitle>Últimos Pedidos</CardTitle>
                  <CardDescription>Atividade mais recente na região</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                            #{order.order_number}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "HH:mm 'em' dd/MM")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black">R$ {Number(order.total).toFixed(2)}</p>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="establishments" className="space-y-4">
            <Card className="border-none shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Restaurantes e Parceiros</CardTitle>
                  <CardDescription>Cidades: {cityNames.join(", ")}</CardDescription>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar parceiro..." className="pl-9" />
                  </div>
                  <Button className="gap-2" onClick={() => navigate("/franqueado/estabelecimentos/novo")}>
                    <Plus className="w-4 h-4" /> Novo Parceiro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parceiro</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vendas (Total)</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {establishments.map((est) => {
                      const estOrdersTotal = orders
                        .filter(o => o.establishment_id === est.id && o.status === 'delivered')
                        .reduce((acc, curr) => acc + Number(curr.total), 0);

                      return (
                        <TableRow key={est.id}>
                          <TableCell className="font-bold">
                            <div className="flex items-center gap-3">
                              {est.logo_url ? (
                                <img src={est.logo_url} className="w-8 h-8 rounded-full object-cover border" alt="" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px]">
                                  {est.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              {est.name}
                            </div>
                          </TableCell>
                          <TableCell>{cities.find(c => c.id === est.city_id)?.name || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={est.is_open ? "success" : "secondary"}>
                              {est.is_open ? "Aberto" : "Fechado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">R$ {estOrdersTotal.toFixed(2)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-primary hover:text-primary hover:bg-primary/5"
                              onClick={() => navigate(`/franqueado/cardapio/${est.id}`)}
                              title="Gerenciar Cardápio"
                            >
                              <Menu className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-primary hover:text-primary hover:bg-primary/5"
                              onClick={() => navigate(`/franqueado/estabelecimentos/${est.id}/editar`)}
                              title="Editar Estabelecimento"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                             <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-500 hover:text-green-600 hover:bg-green-50"
                              onClick={() => handleWhatsApp(est.phone || "", est.name)}
                              title="Contato WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => handleToggleEst(est.id, est.is_open)}
                            >
                              {est.is_open ? "Fechar" : "Abrir"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prospects" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                { label: "Leads Novos", value: prospects.filter(p => p.status === 'Novo').length, color: "text-blue-500", icon: Building2 },
                { label: "Em Negociação", value: prospects.filter(p => p.status === 'Em Contato' || p.status === 'Negociação').length, color: "text-amber-500", icon: Users },
                { label: "Convertidos", value: prospects.filter(p => p.status === 'Convertido').length, color: "text-emerald-500", icon: CheckCircle },
                { label: "Recusados", value: prospects.filter(p => p.status === 'Recusado').length, color: "text-red-500", icon: XCircle },
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-soft">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">{stat.label}</CardTitle>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-soft">
               <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Relacionamento Local (CRM)</CardTitle>
                  <CardDescription>Gerencie seus contatos comerciais e novos parceiros em sua região.</CardDescription>
                </div>
                <Button className="gap-2" onClick={() => setLeadDialogOpen(true)}>
                  <Plus className="w-4 h-4" /> Novo Lead
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          Nenhum lead encontrado nas cidades: {cityNames.join(", ")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      prospects.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-bold">{p.name}</TableCell>
                          <TableCell>{p.contact_info}</TableCell>
                          <TableCell>{p.city}</TableCell>
                          <TableCell>
                             <Badge 
                              variant="outline" 
                              className={
                                p.status === 'Novo' ? 'text-blue-500 border-blue-200' :
                                (p.status === 'Em Contato' || p.status === 'Negociação') ? 'text-amber-500 border-amber-200' :
                                p.status === 'Convertido' ? 'text-emerald-500 border-emerald-200' :
                                'text-red-500 border-red-200'
                              }
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-500"
                              onClick={() => handleWhatsApp(p.contact_info, p.name)}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
             <Card className="border-none shadow-soft">
               <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cupons da Região</CardTitle>
                  <CardDescription>Crie promoções locais para incentivar o uso do app em sua cidade.</CardDescription>
                </div>
                <Button className="gap-2" onClick={() => setCouponDialogOpen(true)}>
                  <Plus className="w-4 h-4" /> Novo Cupom
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coupons.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-[32px]">
                      <Tag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhum cupom regional criado ainda.</p>
                      <Button variant="link" className="text-primary" onClick={() => setCouponDialogOpen(true)}>
                        Comece criando seu primeiro cupom local
                      </Button>
                    </div>
                  ) : (
                    coupons.map((coupon) => (
                      <Card key={coupon.id} className="border border-primary/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2">
                          <Badge variant={coupon.is_active ? "success" : "secondary"}>
                            {coupon.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <CardHeader>
                          <CardTitle className="text-xl font-black text-primary font-mono">{coupon.code}</CardTitle>
                          <CardDescription>{coupon.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Desconto:</span>
                              <span className="font-bold">
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Min. Pedido:</span>
                              <span className="font-bold">R$ {coupon.min_order_value}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Uso:</span>
                              <span className="font-bold">{coupon.usage_count} / {coupon.usage_limit || '∞'}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                             <Button variant="outline" size="sm" className="flex-1 text-xs">Editar</Button>
                             <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (confirm("Deseja realmente excluir este cupom?")) {
                                  const { error } = await supabase.from("coupons").delete().eq("id", coupon.id);
                                  if (error) toast.error("Erro ao excluir");
                                  else {
                                    toast.success("Cupom excluído");
                                    queryClient.invalidateQueries({ queryKey: ["franchisee-coupons"] });
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <NewCouponDialog 
        open={couponDialogOpen} 
        onOpenChange={setCouponDialogOpen}
        cities={cities}
      />
      
      <NewLeadDialog 
        open={leadDialogOpen} 
        onOpenChange={setLeadDialogOpen}
        cities={cities}
      />
    </div>
  );
};

export default FranchiseeDashboard;
