import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import {
  Store,
  Menu,
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Save,
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

interface City {
  id: string;
  name: string;
  state: string;
}

const EditEstablishment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(defaultOpeningHours);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);

  const [establishmentData, setEstablishmentData] = useState({
    name: "",
    description: "",
    category: "restaurant",
    phone: "",
    address: "",
    neighborhood: "",
    city: "",
    cityId: "",
    deliveryFee: "",
    minOrderValue: "",
    minDeliveryTime: "30",
    maxDeliveryTime: "60",
    isApproved: false,
    isOpen: false,
  });

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

    if (user && isAdmin && id) {
      fetchEstablishment();
      fetchCities();
    }
  }, [user, authLoading, isAdmin, navigate, id]);

  const fetchCities = async () => {
    const { data } = await supabase
      .from("cities")
      .select("id, name, state")
      .eq("is_active", true)
      .order("state")
      .order("name");
    if (data) setCities(data);
  };

  const fetchEstablishment = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setEstablishmentData({
          name: data.name || "",
          description: data.description || "",
          category: data.category || "restaurant",
          phone: data.phone || "",
          address: data.address || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          cityId: (data as any).city_id || "",
          deliveryFee: data.delivery_fee?.toString() || "",
          minOrderValue: data.min_order_value?.toString() || "",
          minDeliveryTime: data.min_delivery_time?.toString() || "30",
          maxDeliveryTime: data.max_delivery_time?.toString() || "60",
          isApproved: data.is_approved || false,
          isOpen: data.is_open || false,
        });
        
        // Parse opening hours from database
        if (data.opening_hours && typeof data.opening_hours === 'object') {
          setOpeningHours(data.opening_hours as unknown as OpeningHours);
        }
        
        // Set images
        setLogoUrl(data.logo_url || null);
        setCoverUrl(data.cover_url || null);
      }
    } catch (error) {
      toast.error("Erro ao carregar estabelecimento");
      navigate("/admin/estabelecimentos");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEstablishmentData({ ...establishmentData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("establishments")
        .update({
          name: establishmentData.name,
          description: establishmentData.description || null,
          category: establishmentData.category,
          phone: establishmentData.phone || null,
          address: establishmentData.address || null,
          neighborhood: establishmentData.neighborhood || null,
          city: establishmentData.city || null,
          city_id: establishmentData.cityId || null,
          delivery_fee: establishmentData.deliveryFee
            ? Number(establishmentData.deliveryFee)
            : 0,
          min_order_value: establishmentData.minOrderValue
            ? Number(establishmentData.minOrderValue)
            : 0,
          min_delivery_time: Number(establishmentData.minDeliveryTime) || 30,
          max_delivery_time: Number(establishmentData.maxDeliveryTime) || 60,
          is_approved: establishmentData.isApproved,
          is_open: establishmentData.isOpen,
          opening_hours: JSON.parse(JSON.stringify(openingHours)) as Json,
          logo_url: logoUrl,
          cover_url: coverUrl,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Estabelecimento atualizado com sucesso!");
      navigate("/admin/estabelecimentos");
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao atualizar estabelecimento");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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
              Editar Estabelecimento
            </h1>
            <p className="text-muted-foreground mt-1">
              Atualize as informações do estabelecimento
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                {/* Image uploads */}
                <div className="flex flex-wrap gap-6 pb-4 border-b">
                  <ImageUpload
                    value={logoUrl}
                    onChange={setLogoUrl}
                    folder="logos"
                    label="Logo"
                    aspectRatio="square"
                  />
                  <ImageUpload
                    value={coverUrl}
                    onChange={setCoverUrl}
                    folder="covers"
                    label="Imagem de Capa"
                    aspectRatio="banner"
                    className="flex-1 min-w-[200px]"
                  />
                </div>

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
                      onChange={handleChange}
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
                    onChange={handleChange}
                    placeholder="Breve descrição do estabelecimento"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Telefone do Estabelecimento
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={establishmentData.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>
                  Controle o status do estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Aprovado</Label>
                    <p className="text-sm text-muted-foreground">
                      O estabelecimento aparecerá para os clientes
                    </p>
                  </div>
                  <Switch
                    checked={establishmentData.isApproved}
                    onCheckedChange={(checked) =>
                      setEstablishmentData({ ...establishmentData, isApproved: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Aberto</Label>
                    <p className="text-sm text-muted-foreground">
                      Indica se o estabelecimento está aberto agora
                    </p>
                  </div>
                  <Switch
                    checked={establishmentData.isOpen}
                    onCheckedChange={(checked) =>
                      setEstablishmentData({ ...establishmentData, isOpen: checked })
                    }
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
                    onChange={handleChange}
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
                      onChange={handleChange}
                      placeholder="Bairro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cityId" className="mb-2 block">
                      Cidade (Cadastrada) *
                    </Label>
                    <Select
                      value={establishmentData.cityId}
                      onValueChange={(value) => {
                        const selectedCity = cities.find(c => c.id === value);
                        setEstablishmentData({ 
                          ...establishmentData, 
                          cityId: value,
                          city: selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : ""
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name} - {city.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {cities.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Nenhuma cidade cadastrada. <a href="/admin/regioes" className="text-primary underline">Cadastrar cidades</a>
                      </p>
                    )}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/estabelecimentos")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditEstablishment;
