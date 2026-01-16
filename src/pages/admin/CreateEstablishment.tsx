import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import AdminSidebar from "@/components/admin/AdminSidebar";
import OpeningHoursEditor, { 
  OpeningHours, 
  defaultOpeningHours 
} from "@/components/admin/OpeningHoursEditor";
import { toast } from "sonner";
import {
  Store,
  Menu,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Clock,
  DollarSign,
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

const CATEGORIES = [
  { value: "restaurant", label: "Restaurante" },
  { value: "pizzaria", label: "Pizzaria" },
  { value: "hamburgueria", label: "Hamburgueria" },
  { value: "japonesa", label: "Comida Japonesa" },
  { value: "brasileira", label: "Comida Brasileira" },
  { value: "italiana", label: "Comida Italiana" },
  { value: "chinesa", label: "Comida Chinesa" },
  { value: "mexicana", label: "Comida Mexicana" },
  { value: "acai", label: "Açaí" },
  { value: "sorveteria", label: "Sorveteria" },
  { value: "padaria", label: "Padaria" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "doceria", label: "Doceria" },
  { value: "saudavel", label: "Saudável" },
  { value: "vegano", label: "Vegano" },
  { value: "bebidas", label: "Bebidas" },
  { value: "mercado", label: "Mercado" },
  { value: "farmacia", label: "Farmácia" },
  { value: "petshop", label: "Pet Shop" },
  { value: "outros", label: "Outros" },
];

const CreateEstablishment = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Owner data
  const [ownerData, setOwnerData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });

  // Establishment data
  const [establishmentData, setEstablishmentData] = useState({
    name: "",
    description: "",
    category: "restaurant",
    phone: "",
    address: "",
    neighborhood: "",
    city: "",
    deliveryFee: "",
    minOrderValue: "",
    minDeliveryTime: "30",
    maxDeliveryTime: "60",
  });

  const [autoApprove, setAutoApprove] = useState(true);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(defaultOpeningHours);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user && !isAdmin) {
      toast.error("Acesso negado. Área restrita para administradores.");
      navigate("/");
      return;
    }
  }, [user, authLoading, isAdmin, navigate]);

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOwnerData({ ...ownerData, [e.target.name]: e.target.value });
  };

  const handleEstablishmentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEstablishmentData({ ...establishmentData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: ownerData.email,
        password: ownerData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: ownerData.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // 2. Add establishment role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: "establishment",
      });

      if (roleError) throw roleError;

      // 3. Update profile with phone
      if (ownerData.phone) {
        await supabase
          .from("profiles")
          .update({ phone: ownerData.phone })
          .eq("user_id", authData.user.id);
      }

      // 4. Create establishment
      const { error: establishmentError } = await supabase.from("establishments").insert({
        owner_id: authData.user.id,
        name: establishmentData.name,
        description: establishmentData.description || null,
        category: establishmentData.category,
        phone: establishmentData.phone || null,
        address: establishmentData.address || null,
        neighborhood: establishmentData.neighborhood || null,
        city: establishmentData.city || null,
        delivery_fee: establishmentData.deliveryFee ? Number(establishmentData.deliveryFee) : 0,
        min_order_value: establishmentData.minOrderValue
          ? Number(establishmentData.minOrderValue)
          : 0,
        min_delivery_time: Number(establishmentData.minDeliveryTime) || 30,
        max_delivery_time: Number(establishmentData.maxDeliveryTime) || 60,
        is_approved: autoApprove,
        opening_hours: JSON.parse(JSON.stringify(openingHours)) as Json,
      });

      if (establishmentError) throw establishmentError;

      toast.success("Estabelecimento cadastrado com sucesso!");
      navigate("/admin/estabelecimentos");
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao cadastrar estabelecimento");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/estabelecimentos")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Store className="w-7 h-7 text-primary" />
              Cadastrar Novo Estabelecimento
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie uma conta para o proprietário e cadastre o estabelecimento
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Owner Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dados do Proprietário
                </CardTitle>
                <CardDescription>
                  Informações da conta do proprietário do estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-primary" />
                      Nome Completo *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={ownerData.fullName}
                      onChange={handleOwnerChange}
                      placeholder="Nome do proprietário"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerPhone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-primary" />
                      Telefone
                    </Label>
                    <Input
                      id="ownerPhone"
                      name="phone"
                      value={ownerData.phone}
                      onChange={handleOwnerChange}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-primary" />
                      E-mail *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={ownerData.email}
                      onChange={handleOwnerChange}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Senha *
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={ownerData.password}
                      onChange={handleOwnerChange}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Establishment Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Dados do Estabelecimento
                </CardTitle>
                <CardDescription>
                  Informações básicas sobre o estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-primary" />
                      Nome do Estabelecimento *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={establishmentData.name}
                      onChange={handleEstablishmentChange}
                      placeholder="Nome do negócio"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="flex items-center gap-2 mb-2">
                      Categoria *
                    </Label>
                    <Select
                      value={establishmentData.category}
                      onValueChange={(value) =>
                        setEstablishmentData({ ...establishmentData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="mb-2 block">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={establishmentData.description}
                    onChange={handleEstablishmentChange}
                    placeholder="Breve descrição do estabelecimento"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="establishmentPhone" className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Telefone do Estabelecimento
                  </Label>
                  <Input
                    id="establishmentPhone"
                    name="phone"
                    value={establishmentData.phone}
                    onChange={handleEstablishmentChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address" className="mb-2 block">
                    Endereço Completo
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={establishmentData.address}
                    onChange={handleEstablishmentChange}
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="neighborhood" className="mb-2 block">
                      Bairro
                    </Label>
                    <Input
                      id="neighborhood"
                      name="neighborhood"
                      value={establishmentData.neighborhood}
                      onChange={handleEstablishmentChange}
                      placeholder="Bairro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="mb-2 block">
                      Cidade
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={establishmentData.city}
                      onChange={handleEstablishmentChange}
                      placeholder="Cidade"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Configurações de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryFee" className="mb-2 block">
                      Taxa de Entrega (R$)
                    </Label>
                    <Input
                      id="deliveryFee"
                      name="deliveryFee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={establishmentData.deliveryFee}
                      onChange={handleEstablishmentChange}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minOrderValue" className="mb-2 block">
                      Pedido Mínimo (R$)
                    </Label>
                    <Input
                      id="minOrderValue"
                      name="minOrderValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={establishmentData.minOrderValue}
                      onChange={handleEstablishmentChange}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minDeliveryTime" className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Tempo Mínimo (min)
                    </Label>
                    <Input
                      id="minDeliveryTime"
                      name="minDeliveryTime"
                      type="number"
                      min="5"
                      value={establishmentData.minDeliveryTime}
                      onChange={handleEstablishmentChange}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxDeliveryTime" className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Tempo Máximo (min)
                    </Label>
                    <Input
                      id="maxDeliveryTime"
                      name="maxDeliveryTime"
                      type="number"
                      min="5"
                      value={establishmentData.maxDeliveryTime}
                      onChange={handleEstablishmentChange}
                      placeholder="60"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opening Hours */}
            <Card>
              <CardContent className="pt-6">
                <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />
              </CardContent>
            </Card>

            {/* Auto Approve */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Aprovar Automaticamente</Label>
                    <p className="text-sm text-muted-foreground">
                      Marcar o estabelecimento como aprovado ao cadastrar
                    </p>
                  </div>
                  <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/estabelecimentos")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar Estabelecimento"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateEstablishment;
