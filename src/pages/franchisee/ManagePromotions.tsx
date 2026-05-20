import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Megaphone,
  Plus,
  Search,
  Pencil,
  Trash2,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { format } from "date-fns";
import ImageUpload from "@/components/admin/ImageUpload";

const ManagePromotions = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [promotions, setPromotions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog/Modal states (simplified)
  const [showModal, setShowModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    banner_url: "",
    valid_from: format(new Date(), "yyyy-MM-dd"),
    valid_until: "",
    city_id: "",
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      // 1. Fetch managed cities
      const { data: managedCitiesRes } = await supabase
        .from("franchisee_cities")
        .select("city_id, cities(name, state)")
        .eq("franchisee_id", user!.id);

      const managedCityIds = managedCitiesRes?.map(c => c.city_id) || [];
      const managedCitiesData = managedCitiesRes?.map(c => ({ id: c.city_id, ...c.cities })) || [];
      setCities(managedCitiesData);

      // 2. Fetch establishments in these cities
      const { data: estabs } = await supabase
        .from("establishments")
        .select("id, name")
        .in("city_id", managedCityIds);
      setEstablishments(estabs || []);

      // 3. Fetch promotions for these cities
      const { data: promos } = await supabase
        .from("promotions")
        .select("*")
        .in("city_id", managedCityIds)
        .order("created_at", { ascending: false });
      setPromotions(promos || []);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.city_id) {
      toast.error("Preencha o título e selecione uma cidade");
      return;
    }

    setSaving(true);
    try {
      const promoData = {
        title: formData.title,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        banner_url: formData.banner_url,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until || null,
        city_id: formData.city_id,
        is_active: formData.is_active,
      };

      if (selectedPromotion) {
        const { error } = await supabase
          .from("promotions")
          .update(promoData)
          .eq("id", selectedPromotion.id);
        if (error) throw error;
        toast.success("Promoção atualizada!");
      } else {
        const { error } = await supabase.from("promotions").insert(promoData);
        if (error) throw error;
        toast.success("Promoção criada!");
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar promoção");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta promoção?")) return;
    await supabase.from("promotions").delete().eq("id", id);
    toast.success("Promoção excluída");
    fetchData();
  };

  const toggleStatus = async (promo: any) => {
    await supabase.from("promotions").update({ is_active: !promo.is_active }).eq("id", promo.id);
    fetchData();
  };

  const openEdit = (promo: any) => {
    setSelectedPromotion(promo);
    setFormData({
      title: promo.title,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value?.toString() || "",
      banner_url: promo.banner_url || "",
      valid_from: promo.valid_from.split("T")[0],
      valid_until: promo.valid_until ? promo.valid_until.split("T")[0] : "",
      city_id: promo.city_id || "",
      is_active: promo.is_active,
    });
    setShowModal(true);
  };

  const filtered = promotions.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-sm">
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
           <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate("/franqueado")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-black">Marketing e Promoções Regionais</h1>
                <p className="text-muted-foreground">Gerencie banners e campanhas para suas cidades</p>
              </div>
           </div>
           <Button onClick={() => {
             setSelectedPromotion(null);
             setFormData({
               title: "",
               description: "",
               discount_type: "percentage",
               discount_value: "",
               banner_url: "",
               valid_from: format(new Date(), "yyyy-MM-dd"),
               valid_until: "",
               city_id: cities[0]?.id || "",
               is_active: true,
             });
             setShowModal(true);
           }}>
             <Plus className="w-4 h-4 mr-2" /> Nova Promoção
           </Button>
        </div>

        <Card className="border-none shadow-soft">
           <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar promoção..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>
              </div>
           </CardHeader>
           <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {filtered.map(p => (
                   <Card key={p.id} className="overflow-hidden">
                      <div className="aspect-[21/9] relative bg-muted">
                         {p.banner_url ? (
                           <img src={p.banner_url} className="w-full h-full object-cover" alt="" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground/20" />
                           </div>
                         )}
                         <div className="absolute top-2 right-2 flex gap-1">
                            <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Ativo" : "Inativo"}</Badge>
                         </div>
                      </div>
                      <CardContent className="p-4 space-y-3">
                         <div>
                            <h3 className="font-bold text-lg">{p.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                         </div>
                         <div className="flex items-center justify-between text-xs">
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                               {cities.find(c => c.id === p.city_id)?.name || "N/A"}
                            </span>
                            <span className="text-muted-foreground">Expira: {p.valid_until ? format(new Date(p.valid_until), "dd/MM/yy") : "N/A"}</span>
                         </div>
                         <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-1">
                               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(p)}>
                                  {p.is_active ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                               </Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                                  <Pencil className="w-4 h-4" />
                               </Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                                  <Trash2 className="w-4 h-4" />
                               </Button>
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                 ))}
              </div>
           </CardContent>
        </Card>
      </main>

      {/* Simplified Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
             <div className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold">{selectedPromotion ? "Editar Promoção" : "Nova Promoção"}</h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-4">
                      <div><Label>Título *</Label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                      <div><Label>Descrição</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                      <div><Label>Cidade *</Label>
                        <select className="w-full p-2 border rounded-md bg-background" value={formData.city_id} onChange={e => setFormData({...formData, city_id: e.target.value})}>
                           {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div><Label>Banner</Label><ImageUpload value={formData.banner_url} onChange={url => setFormData({...formData, banner_url: url})} bucket="establishments" /></div>
                      <div className="grid grid-cols-2 gap-2">
                         <div><Label>Início</Label><Input type="date" value={formData.valid_from} onChange={e => setFormData({...formData, valid_from: e.target.value})} /></div>
                         <div><Label>Fim</Label><Input type="date" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} /></div>
                      </div>
                   </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-2">
                   <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                   <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ManagePromotions;
