import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Loader2
} from "lucide-react";
import { ESTABLISHMENT_CATEGORIES } from "@/constants/categories";

const CreateEstablishment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [franchisee, setFranchisee] = useState<any>(null);

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
    cityId: "",
    deliveryFee: "0",
    minOrderValue: "0",
    minDeliveryTime: "30",
    maxDeliveryTime: "60",
  });

  const [autoApprove, setAutoApprove] = useState(true);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(defaultOpeningHours);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get franchisee data
      const { data: fran } = await supabase
        .from("franchisees")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (!fran) {
        toast.error("Acesso negado");
        navigate("/");
        return;
      }
      setFranchisee(fran);

      // Get managed cities
      const { data: managedCities } = await supabase
        .from("cities")
        .select("*")
        .eq("franchisee_id", user.id);
      
      if (managedCities) setCities(managedCities);
    };
    fetchData();
  }, [navigate]);

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

    if (!establishmentData.cityId) {
      toast.error("Por favor, selecione uma cidade");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-establishment", {
        body: {
          ownerData,
          establishmentData: {
            ...establishmentData,
            is_approved: autoApprove,
            opening_hours: JSON.parse(JSON.stringify(openingHours)),
            logo_url: logoUrl,
            cover_url: coverUrl,
          },
        },
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || "Erro ao cadastrar estabelecimento");
      }

      toast.success("Estabelecimento cadastrado com sucesso!");
      navigate("/franqueado");
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar estabelecimento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/franqueado")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="font-display font-bold text-xl text-primary">Novo Parceiro</h1>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl mx-auto space-y-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold">Cadastrar Novo Estabelecimento</h2>
          <p className="text-muted-foreground mt-1">
            Crie uma conta para o proprietário e cadastre o estabelecimento em sua região.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Dados do Proprietário
              </CardTitle>
              <CardDescription>Informações de acesso do parceiro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input id="fullName" name="fullName" value={ownerData.fullName} onChange={handleOwnerChange} required />
                </div>
                <div>
                  <Label htmlFor="ownerPhone">WhatsApp *</Label>
                  <Input id="ownerPhone" name="phone" value={ownerData.phone} onChange={handleOwnerChange} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input id="email" name="email" type="email" value={ownerData.email} onChange={handleOwnerChange} required />
                </div>
                <div>
                  <Label htmlFor="password">Senha Temporária *</Label>
                  <Input id="password" name="password" type="password" value={ownerData.password} onChange={handleOwnerChange} minLength={6} required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Dados do Estabelecimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-6 pb-4 border-b">
                <ImageUpload value={logoUrl} onChange={setLogoUrl} folder="logos" label="Logo (PNG/JPG)" aspectRatio="square" />
                <ImageUpload value={coverUrl} onChange={setCoverUrl} folder="covers" label="Capa do Menu" aspectRatio="banner" className="flex-1 min-w-[200px]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Negócio *</Label>
                  <Input id="name" name="name" value={establishmentData.name} onChange={handleEstablishmentChange} required />
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
                <Textarea id="description" name="description" value={establishmentData.description} onChange={handleEstablishmentChange} placeholder="Ex: A melhor pizza da região..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cityId">Cidade Gerenciada *</Label>
                  <Select
                    value={establishmentData.cityId}
                    onValueChange={(val) => {
                      const city = cities.find(c => c.id === val);
                      setEstablishmentData({ ...establishmentData, cityId: val, city: city ? `${city.name} - ${city.state}` : "" });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione sua cidade" /></SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>{city.name} - {city.state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input id="neighborhood" name="neighborhood" value={establishmentData.neighborhood} onChange={handleEstablishmentChange} />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Endereço Completo</Label>
                <Input id="address" name="address" value={establishmentData.address} onChange={handleEstablishmentChange} placeholder="Rua, número, etc" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Horário de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-[24px] border border-primary/10">
            <div>
              <Label className="text-base font-bold">Aprovar Automaticamente</Label>
              <p className="text-sm text-muted-foreground">O estabelecimento ficará visível no app imediatamente.</p>
            </div>
            <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/franqueado")} className="flex-1 h-12 rounded-xl">Cancelar</Button>
            <Button type="submit" variant="hero" className="flex-1 h-12" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Finalizar Cadastro"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateEstablishment;
