import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Menu,
  Plus,
  Search,
  Pencil,
  Trash2,
  Megaphone,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Image,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number | null;
  min_order_value: number | null;
  banner_url: string | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean | null;
  city_id: string | null;
  neighborhood_id: string | null;
  establishment_id: string | null;
}

interface City {
  id: string;
  name: string;
  state: string;
}

interface Neighborhood {
  id: string;
  name: string;
  city_id: string;
}

interface Establishment {
  id: string;
  name: string;
}

const AdminPromotions = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "",
    banner_url: "",
    valid_from: format(new Date(), "yyyy-MM-dd"),
    valid_until: "",
    city_id: "",
    neighborhood_id: "",
    establishment_id: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && user && !isAdmin) {
      navigate("/");
      toast.error("Acesso restrito a administradores");
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [promotionsRes, citiesRes, establishmentsRes] = await Promise.all([
        supabase.from("promotions").select("*").order("created_at", { ascending: false }),
        supabase.from("cities").select("*").eq("is_active", true).order("name"),
        supabase.from("establishments").select("id, name").eq("is_approved", true).order("name"),
      ]);

      if (promotionsRes.error) throw promotionsRes.error;
      if (citiesRes.error) throw citiesRes.error;
      if (establishmentsRes.error) throw establishmentsRes.error;

      setPromotions(promotionsRes.data || []);
      setCities(citiesRes.data || []);
      setEstablishments(establishmentsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const fetchNeighborhoods = async (cityId: string) => {
    try {
      const { data, error } = await supabase
        .from("neighborhoods")
        .select("*")
        .eq("city_id", cityId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setNeighborhoods(data || []);
    } catch (error) {
      console.error("Error fetching neighborhoods:", error);
    }
  };

  const handleOpenDialog = (promotion?: Promotion) => {
    if (promotion) {
      setSelectedPromotion(promotion);
      setFormData({
        title: promotion.title,
        description: promotion.description || "",
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value?.toString() || "",
        min_order_value: promotion.min_order_value?.toString() || "",
        banner_url: promotion.banner_url || "",
        valid_from: promotion.valid_from.split("T")[0],
        valid_until: promotion.valid_until ? promotion.valid_until.split("T")[0] : "",
        city_id: promotion.city_id || "",
        neighborhood_id: promotion.neighborhood_id || "",
        establishment_id: promotion.establishment_id || "",
      });
      if (promotion.city_id) {
        fetchNeighborhoods(promotion.city_id);
      }
    } else {
      setSelectedPromotion(null);
      setFormData({
        title: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        min_order_value: "",
        banner_url: "",
        valid_from: format(new Date(), "yyyy-MM-dd"),
        valid_until: "",
        city_id: "",
        neighborhood_id: "",
        establishment_id: "",
      });
      setNeighborhoods([]);
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `promotions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("establishments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("establishments")
        .getPublicUrl(filePath);

      setFormData({ ...formData, banner_url: urlData.publicUrl });
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error("Preencha o título da promoção");
      return;
    }

    setSaving(true);
    try {
      const promotionData = {
        title: formData.title,
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
        banner_url: formData.banner_url || null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until || null,
        city_id: formData.city_id || null,
        neighborhood_id: formData.neighborhood_id || null,
        establishment_id: formData.establishment_id || null,
      };

      if (selectedPromotion) {
        const { error } = await supabase
          .from("promotions")
          .update(promotionData)
          .eq("id", selectedPromotion.id);

        if (error) throw error;
        toast.success("Promoção atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("promotions").insert(promotionData);

        if (error) throw error;
        toast.success("Promoção criada com sucesso!");
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving promotion:", error);
      toast.error(error.message || "Erro ao salvar promoção");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    try {
      const { error } = await supabase
        .from("promotions")
        .update({ is_active: !promotion.is_active })
        .eq("id", promotion.id);

      if (error) throw error;
      toast.success(promotion.is_active ? "Promoção desativada" : "Promoção ativada");
      fetchData();
    } catch (error) {
      console.error("Error toggling promotion:", error);
      toast.error("Erro ao alterar status da promoção");
    }
  };

  const handleDelete = async () => {
    if (!selectedPromotion) return;

    try {
      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", selectedPromotion.id);

      if (error) throw error;
      toast.success("Promoção excluída com sucesso!");
      setDeleteDialogOpen(false);
      setSelectedPromotion(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error("Erro ao excluir promoção");
    }
  };

  const filteredPromotions = promotions.filter(
    (promotion) =>
      promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDiscount = (promotion: Promotion) => {
    if (!promotion.discount_value) return "—";
    if (promotion.discount_type === "percentage") {
      return `${promotion.discount_value}%`;
    } else if (promotion.discount_type === "fixed") {
      return `R$ ${promotion.discount_value.toFixed(2)}`;
    } else if (promotion.discount_type === "free_delivery") {
      return "Frete Grátis";
    }
    return promotion.discount_value.toString();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 bg-background/95 backdrop-blur border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Promoções</h1>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Promoção
          </Button>
        </header>

        <div className="p-6 space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banner</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromotions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma promoção encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPromotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        {promotion.banner_url ? (
                          <img
                            src={promotion.banner_url}
                            alt={promotion.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                            <Image className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{promotion.title}</p>
                          {promotion.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {promotion.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{formatDiscount(promotion)}</Badge>
                        {promotion.min_order_value && promotion.min_order_value > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Mín: R$ {promotion.min_order_value.toFixed(2)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {format(new Date(promotion.valid_from), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        {promotion.valid_until && (
                          <p className="text-xs text-muted-foreground">
                            até {format(new Date(promotion.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {promotion.city_id || promotion.neighborhood_id ? (
                          <Badge variant="outline">Regional</Badge>
                        ) : promotion.establishment_id ? (
                          <Badge variant="outline">Estabelecimento</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Geral</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={promotion.is_active ? "default" : "outline"}>
                          {promotion.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(promotion)}
                            title={promotion.is_active ? "Desativar" : "Ativar"}
                          >
                            {promotion.is_active ? (
                              <ToggleRight className="w-4 h-4 text-primary" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(promotion)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPromotion(promotion);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPromotion ? "Editar Promoção" : "Nova Promoção"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: 10% OFF em toda a loja"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada da promoção"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Banner</Label>
              <div className="flex items-center gap-4">
                {formData.banner_url ? (
                  <img
                    src={formData.banner_url}
                    alt="Banner preview"
                    className="w-32 h-20 object-cover rounded border"
                  />
                ) : (
                  <div className="w-32 h-20 bg-muted rounded border flex items-center justify-center">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <p className="text-xs text-muted-foreground mt-1">Enviando...</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Tipo de Desconto</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    <SelectItem value="free_delivery">Frete Grátis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.discount_type !== "free_delivery" && (
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Valor {formData.discount_type === "percentage" ? "(%)" : "(R$)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder="10"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_order_value">Valor Mínimo do Pedido (R$)</Label>
              <Input
                id="min_order_value"
                type="number"
                value={formData.min_order_value}
                onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Válido a partir de</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Válido até</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Segmentação Regional (opcional)</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="city_id">Cidade</Label>
                  <Select
                    value={formData.city_id}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        city_id: value === "all" ? "" : value,
                        neighborhood_id: "",
                      });
                      if (value && value !== "all") {
                        fetchNeighborhoods(value);
                      } else {
                        setNeighborhoods([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as cidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as cidades</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name} - {city.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.city_id && neighborhoods.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood_id">Bairro</Label>
                    <Select
                      value={formData.neighborhood_id}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          neighborhood_id: value === "all" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os bairros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os bairros</SelectItem>
                        {neighborhoods.map((neighborhood) => (
                          <SelectItem key={neighborhood.id} value={neighborhood.id}>
                            {neighborhood.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="establishment_id">Estabelecimento</Label>
                  <Select
                    value={formData.establishment_id}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        establishment_id: value === "all" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os estabelecimentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estabelecimentos</SelectItem>
                      {establishments.map((est) => (
                        <SelectItem key={est.id} value={est.id}>
                          {est.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedPromotion ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir promoção?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A promoção{" "}
              <strong>{selectedPromotion?.title}</strong> será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPromotions;
