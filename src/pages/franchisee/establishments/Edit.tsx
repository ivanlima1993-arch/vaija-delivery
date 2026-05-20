import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import OpeningHoursEditor, {
  OpeningHours,
  defaultOpeningHours
} from "@/components/admin/OpeningHoursEditor";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import {
  Store,
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Save,
  Loader2
} from "lucide-react";
import { ESTABLISHMENT_CATEGORIES } from "@/constants/categories";

const EditEstablishment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<any[]>([]);

  const [establishmentData, setEstablishmentData] = useState({
    name: "",
    description: "",
    category: "restaurant",
    phone: "",
    address: "",
    neighborhood: "",
    city: "",
    cityId: "",
    deliveryFee: "0",
    minOrderValue: "0",
    minDeliveryTime: "30",
    maxDeliveryTime: "60",
    isApproved: false,
    isOpen: false,
  });

  const [openingHours, setOpeningHours] = useState<OpeningHours>(defaultOpeningHours);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      // Get managed cities to ensure permission
      const { data: managedCities } = await supabase
        .from("cities")
        .select("id, name, state")
        .eq("franchisee_id", user.id);
      
      if (managedCities) setCities(managedCities);
      const cityIds = managedCities?.map(c => c.id) || [];

      // Fetch establishment and verify it belongs to managed cities
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data || !cityIds.includes(data.city_id)) {
        toast.error("Você não tem permissão para editar este estabelecimento.");
        navigate("/franqueado");
        return;
      }

      setEstablishmentData({
        name: data.name || "",
        description: data.description || "",
        category: data.category || "restaurant",
        phone: data.phone || "",
        address: data.address || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        cityId: data.city_id || "",
        deliveryFee: data.delivery_fee?.toString() || "0",
        minOrderValue: data.min_order_value?.toString() || "0",
        minDeliveryTime: data.min_delivery_time?.toString() || "30",
        maxDeliveryTime: data.max_delivery_time?.toString() || "60",
        isApproved: data.is_approved || false,
        isOpen: data.is_open || false,
      });

      if (data.opening_hours) setOpeningHours(data.opening_hours as any);
      setLogoUrl(data.logo_url);
      setCoverUrl(data.cover_url);
      setLoading(false);
    };
    if (id) fetchData();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          description: establishmentData.description,
          category: establishmentData.category,
          phone: establishmentData.phone,
          address: establishmentData.address,
          neighborhood: establishmentData.neighborhood,
          city: establishmentData.city,
          city_id: establishmentData.cityId,
          delivery_fee: Number(establishmentData.deliveryFee),
          min_order_value: Number(establishmentData.minOrderValue),
          min_delivery_time: Number(establishmentData.minDeliveryTime),
          max_delivery_time: Number(establishmentData.maxDeliveryTime),
          is_approved: establishmentData.isApproved,
          is_open: establishmentData.isOpen,
          opening_hours: JSON.parse(JSON.stringify(openingHours)),
          logo_url: logoUrl,
          cover_url: coverUrl,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Alterações salvas com sucesso!");
      navigate("/franqueado");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/franqueado")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="font-display font-bold text-xl text-primary">Editar Parceiro</h1>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl mx-auto space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Dados Básicos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-6 pb-4 border-b">
                <ImageUpload value={logoUrl} onChange={setLogoUrl} folder="logos" label="Logo" aspectRatio="square" />
                <ImageUpload value={coverUrl} onChange={setCoverUrl} folder="covers" label="Capa" aspectRatio="banner" className="flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" value={establishmentData.name} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={establishmentData.category} onValueChange={(val) => setEstablishmentData({ ...establishmentData, category: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESTABLISHMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" value={establishmentData.description} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader><CardTitle>Status e Entrega</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-xl">
                    <Label>Aprovado</Label>
                    <Switch checked={establishmentData.isApproved} onCheckedChange={(val) => setEstablishmentData({...establishmentData, isApproved: val})} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-xl">
                    <Label>Aberto Agora</Label>
                    <Switch checked={establishmentData.isOpen} onCheckedChange={(val) => setEstablishmentData({...establishmentData, isOpen: val})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Taxa Entrega (R$)</Label>
                    <Input name="deliveryFee" type="number" step="0.01" value={establishmentData.deliveryFee} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Tempo Médio (min)</Label>
                    <Input name="maxDeliveryTime" type="number" value={establishmentData.maxDeliveryTime} onChange={handleChange} />
                  </div>
                </div>
             </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Endereço e Horários</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cidade</Label>
                  <Select value={establishmentData.cityId} onValueChange={(val) => setEstablishmentData({...establishmentData, cityId: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input name="neighborhood" value={establishmentData.neighborhood} onChange={handleChange} />
                </div>
              </div>
              <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />
            </CardContent>
          </Card>

          <Button type="submit" variant="hero" className="w-full h-12" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Alterações
          </Button>
        </form>
      </main>
    </div>
  );
};

export default EditEstablishment;
