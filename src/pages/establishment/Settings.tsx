import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Store, MapPin, Clock, DollarSign, Phone, Save, Menu as MenuIcon } from "lucide-react";
import OpeningHoursEditor, { 
  OpeningHours, 
  defaultOpeningHours 
} from "@/components/admin/OpeningHoursEditor";
import ImageUpload from "@/components/admin/ImageUpload";
import type { Database, Json } from "@/integrations/supabase/types";

interface City {
  id: string;
  name: string;
  state: string;
}

type Establishment = Database["public"]["Tables"]["establishments"]["Row"];

const EstablishmentSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isEstablishment } = useAuth();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(defaultOpeningHours);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
    city: "",
    neighborhood: "",
    delivery_fee: "",
    min_delivery_time: "",
    max_delivery_time: "",
    min_order_value: "",
    is_open: false,
  });

  useEffect(() => {
    if (!authLoading && (!user || !isEstablishment)) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchEstablishment();
      fetchCities();
    }
  }, [user, authLoading, isEstablishment, navigate]);

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from("cities")
      .select("id, name, state")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setCities(data);
    }
  };

  const fetchEstablishment = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEstablishment(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          neighborhood: data.neighborhood || "",
          delivery_fee: data.delivery_fee ? String(data.delivery_fee) : "",
          min_delivery_time: data.min_delivery_time ? String(data.min_delivery_time) : "",
          max_delivery_time: data.max_delivery_time ? String(data.max_delivery_time) : "",
          min_order_value: data.min_order_value ? String(data.min_order_value) : "",
          is_open: data.is_open || false,
        });
        setSelectedCityId(data.city_id || "");
        setLogoUrl(data.logo_url || null);
        setCoverUrl(data.cover_url || null);
        
        // Parse opening hours from database
        if (data.opening_hours && typeof data.opening_hours === 'object') {
          setOpeningHours(data.opening_hours as unknown as OpeningHours);
        }
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!establishment) return;

    setSaving(true);
    try {
      const selectedCity = cities.find(c => c.id === selectedCityId);
      const { error } = await supabase
        .from("establishments")
        .update({
          name: formData.name,
          description: formData.description,
          phone: formData.phone,
          address: formData.address,
          city: selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : formData.city,
          city_id: selectedCityId || null,
          neighborhood: formData.neighborhood,
          delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : 0,
          min_delivery_time: formData.min_delivery_time ? parseInt(formData.min_delivery_time) : 30,
          max_delivery_time: formData.max_delivery_time ? parseInt(formData.max_delivery_time) : 60,
          min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
          logo_url: logoUrl,
          cover_url: coverUrl,
          is_open: formData.is_open,
          opening_hours: JSON.parse(JSON.stringify(openingHours)) as Json,
        })
        .eq("id", establishment.id);

      if (error) throw error;

      toast.success("Configurações salvas!");
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      <EstablishmentSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg">Configurações</h1>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
        {/* Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Estabelecimento Aberto</Label>
                <p className="text-sm text-muted-foreground">
                  Clientes podem fazer pedidos quando aberto
                </p>
              </div>
              <Switch
                checked={formData.is_open}
                onCheckedChange={(checked) => setFormData({ ...formData, is_open: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens</CardTitle>
            <CardDescription>Logo e capa do seu estabelecimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
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
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Estabelecimento</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome do seu negócio"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descreva seu estabelecimento"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone/WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opening Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horário de Funcionamento
            </CardTitle>
            <CardDescription>
              Configure os horários de abertura e fechamento para cada dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />
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
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Rua, número..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  placeholder="Bairro"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Select value={selectedCityId} onValueChange={setSelectedCityId}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_delivery_time">Tempo Mínimo (min)</Label>
                <Input
                  id="min_delivery_time"
                  name="min_delivery_time"
                  type="number"
                  value={formData.min_delivery_time}
                  onChange={handleChange}
                  placeholder="30"
                />
              </div>
              <div>
                <Label htmlFor="max_delivery_time">Tempo Máximo (min)</Label>
                <Input
                  id="max_delivery_time"
                  name="max_delivery_time"
                  type="number"
                  value={formData.max_delivery_time}
                  onChange={handleChange}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_fee">Taxa de Entrega (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="delivery_fee"
                    name="delivery_fee"
                    type="number"
                    step="0.01"
                    value={formData.delivery_fee}
                    onChange={handleChange}
                    placeholder="5.00"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="min_order_value">Pedido Mínimo (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="min_order_value"
                    name="min_order_value"
                    type="number"
                    step="0.01"
                    value={formData.min_order_value}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button (mobile friendly) */}
        <div className="pb-6">
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentSettings;
