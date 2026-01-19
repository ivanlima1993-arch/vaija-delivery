import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Ticket,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number | null;
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

const AdminCoupons = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "",
    max_discount: "",
    usage_limit: "",
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
      const [couponsRes, citiesRes, establishmentsRes] = await Promise.all([
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        supabase.from("cities").select("*").eq("is_active", true).order("name"),
        supabase.from("establishments").select("id, name").eq("is_approved", true).order("name"),
      ]);

      if (couponsRes.error) throw couponsRes.error;
      if (citiesRes.error) throw citiesRes.error;
      if (establishmentsRes.error) throw establishmentsRes.error;

      setCoupons(couponsRes.data || []);
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

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setSelectedCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || "",
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value.toString(),
        min_order_value: coupon.min_order_value?.toString() || "",
        max_discount: coupon.max_discount?.toString() || "",
        usage_limit: coupon.usage_limit?.toString() || "",
        valid_from: coupon.valid_from.split("T")[0],
        valid_until: coupon.valid_until ? coupon.valid_until.split("T")[0] : "",
        city_id: coupon.city_id || "",
        neighborhood_id: coupon.neighborhood_id || "",
        establishment_id: coupon.establishment_id || "",
      });
      if (coupon.city_id) {
        fetchNeighborhoods(coupon.city_id);
      }
    } else {
      setSelectedCoupon(null);
      setFormData({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        min_order_value: "",
        max_discount: "",
        usage_limit: "",
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

  const handleSave = async () => {
    if (!formData.code || !formData.discount_value) {
      toast.error("Preencha o código e o valor do desconto");
      return;
    }

    setSaving(true);
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until || null,
        city_id: formData.city_id || null,
        neighborhood_id: formData.neighborhood_id || null,
        establishment_id: formData.establishment_id || null,
      };

      if (selectedCoupon) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", selectedCoupon.id);

        if (error) throw error;
        toast.success("Cupom atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("coupons").insert(couponData);

        if (error) throw error;
        toast.success("Cupom criado com sucesso!");
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      toast.error(error.message || "Erro ao salvar cupom");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !coupon.is_active })
        .eq("id", coupon.id);

      if (error) throw error;
      toast.success(coupon.is_active ? "Cupom desativado" : "Cupom ativado");
      fetchData();
    } catch (error) {
      console.error("Error toggling coupon:", error);
      toast.error("Erro ao alterar status do cupom");
    }
  };

  const handleDelete = async () => {
    if (!selectedCoupon) return;

    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", selectedCoupon.id);

      if (error) throw error;
      toast.success("Cupom excluído com sucesso!");
      setDeleteDialogOpen(false);
      setSelectedCoupon(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Erro ao excluir cupom");
    }
  };

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}%`;
    } else if (coupon.discount_type === "fixed") {
      return `R$ ${coupon.discount_value.toFixed(2)}`;
    } else if (coupon.discount_type === "free_delivery") {
      return "Frete Grátis";
    }
    return coupon.discount_value.toString();
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
              <Ticket className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Cupons de Desconto</h1>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cupom
          </Button>
        </header>

        <div className="p-6 space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou descrição..."
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
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum cupom encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div>
                          <p className="font-mono font-bold">{coupon.code}</p>
                          {coupon.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {coupon.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{formatDiscount(coupon)}</Badge>
                        {coupon.min_order_value && coupon.min_order_value > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Mín: R$ {coupon.min_order_value.toFixed(2)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {format(new Date(coupon.valid_from), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        {coupon.valid_until && (
                          <p className="text-xs text-muted-foreground">
                            até {format(new Date(coupon.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {coupon.usage_count || 0}
                          {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.is_active ? "default" : "outline"}>
                          {coupon.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(coupon)}
                            title={coupon.is_active ? "Desativar" : "Ativar"}
                          >
                            {coupon.is_active ? (
                              <ToggleRight className="w-4 h-4 text-primary" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(coupon)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCoupon(coupon);
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
              {selectedCoupon ? "Editar Cupom" : "Novo Cupom"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="PROMO10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_type">Tipo de Desconto</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, discount_type: value })
                  }
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição do cupom"
              />
            </div>

            {formData.discount_type !== "free_delivery" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Valor do Desconto *{" "}
                    {formData.discount_type === "percentage" ? "(%)" : "(R$)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: e.target.value })
                    }
                    placeholder="10"
                  />
                </div>
                {formData.discount_type === "percentage" && (
                  <div className="space-y-2">
                    <Label htmlFor="max_discount">Desconto Máximo (R$)</Label>
                    <Input
                      id="max_discount"
                      type="number"
                      value={formData.max_discount}
                      onChange={(e) =>
                        setFormData({ ...formData, max_discount: e.target.value })
                      }
                      placeholder="50"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_order_value">Valor Mínimo do Pedido</Label>
                <Input
                  id="min_order_value"
                  type="number"
                  value={formData.min_order_value}
                  onChange={(e) =>
                    setFormData({ ...formData, min_order_value: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Limite de Uso</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: e.target.value })
                  }
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Válido a partir de</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_from: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Válido até</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_until: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Restrições (opcional)</p>
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
              {selectedCoupon ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cupom{" "}
              <strong>{selectedCoupon?.code}</strong> será excluído permanentemente.
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

export default AdminCoupons;
