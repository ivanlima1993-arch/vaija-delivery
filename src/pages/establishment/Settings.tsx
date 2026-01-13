import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Store, MapPin, Clock, DollarSign, Phone, Save } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Establishment = Database["public"]["Tables"]["establishments"]["Row"];

const EstablishmentSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isEstablishment } = useAuth();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    logo_url: "",
    cover_url: "",
  });

  useEffect(() => {
    if (!authLoading && (!user || !isEstablishment)) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchEstablishment();
    }
  }, [user, authLoading, isEstablishment, navigate]);

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
          logo_url: data.logo_url || "",
          cover_url: data.cover_url || "",
        });
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
      const { error } = await supabase
        .from("establishments")
        .update({
          name: formData.name,
          description: formData.description,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          neighborhood: formData.neighborhood,
          delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : 0,
          min_delivery_time: formData.min_delivery_time ? parseInt(formData.min_delivery_time) : 30,
          max_delivery_time: formData.max_delivery_time ? parseInt(formData.max_delivery_time) : 60,
          min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
          logo_url: formData.logo_url || null,
          cover_url: formData.cover_url || null,
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/estabelecimento")}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
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
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
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
              <Clock className="w-5 h-5" />
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

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleChange}
                placeholder="https://..."
              />
              {formData.logo_url && (
                <img
                  src={formData.logo_url}
                  alt="Logo preview"
                  className="mt-2 w-24 h-24 object-cover rounded-xl"
                />
              )}
            </div>
            <div>
              <Label htmlFor="cover_url">URL da Capa</Label>
              <Input
                id="cover_url"
                name="cover_url"
                value={formData.cover_url}
                onChange={handleChange}
                placeholder="https://..."
              />
              {formData.cover_url && (
                <img
                  src={formData.cover_url}
                  alt="Cover preview"
                  className="mt-2 w-full h-32 object-cover rounded-xl"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstablishmentSettings;
