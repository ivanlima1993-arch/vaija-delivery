import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Menu } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, MapPin, Building2 } from "lucide-react";

interface City {
  id: string;
  name: string;
  state: string;
  is_active: boolean;
  created_at: string;
}

interface Neighborhood {
  id: string;
  city_id: string;
  name: string;
  delivery_fee: number;
  is_active: boolean;
}

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const Regions = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  // City form state
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityForm, setCityForm] = useState({ name: "", state: "", is_active: true });

  // Neighborhood form state
  const [neighborhoodDialogOpen, setNeighborhoodDialogOpen] = useState(false);
  const [editingNeighborhood, setEditingNeighborhood] = useState<Neighborhood | null>(null);
  const [neighborhoodForm, setNeighborhoodForm] = useState({
    city_id: "",
    name: "",
    delivery_fee: 0,
    is_active: true,
  });

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "city" | "neighborhood"; id: string; name: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      checkAdminAndFetch();
    }
  }, [user, authLoading, navigate]);

  const checkAdminAndFetch = async () => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      navigate("/");
      return;
    }

    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [citiesRes, neighborhoodsRes] = await Promise.all([
        supabase.from("cities").select("*").order("state").order("name"),
        supabase.from("neighborhoods").select("*").order("name"),
      ]);

      if (citiesRes.data) setCities(citiesRes.data);
      if (neighborhoodsRes.data) setNeighborhoods(neighborhoodsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCityExpanded = (cityId: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
    }
    setExpandedCities(newExpanded);
  };

  // City CRUD
  const handleSaveCity = async () => {
    if (!cityForm.name || !cityForm.state) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    try {
      if (editingCity) {
        const { error } = await supabase
          .from("cities")
          .update(cityForm)
          .eq("id", editingCity.id);
        if (error) throw error;
        toast({ title: "Cidade atualizada com sucesso!" });
      } else {
        const { error } = await supabase.from("cities").insert(cityForm);
        if (error) throw error;
        toast({ title: "Cidade cadastrada com sucesso!" });
      }
      setCityDialogOpen(false);
      setEditingCity(null);
      setCityForm({ name: "", state: "", is_active: true });
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao salvar cidade", description: error.message, variant: "destructive" });
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityForm({ name: city.name, state: city.state, is_active: city.is_active });
    setCityDialogOpen(true);
  };

  const handleToggleCityStatus = async (city: City) => {
    try {
      const { error } = await supabase
        .from("cities")
        .update({ is_active: !city.is_active })
        .eq("id", city.id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  // Neighborhood CRUD
  const handleSaveNeighborhood = async () => {
    if (!neighborhoodForm.name || !neighborhoodForm.city_id) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    try {
      if (editingNeighborhood) {
        const { error } = await supabase
          .from("neighborhoods")
          .update(neighborhoodForm)
          .eq("id", editingNeighborhood.id);
        if (error) throw error;
        toast({ title: "Bairro atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("neighborhoods").insert(neighborhoodForm);
        if (error) throw error;
        toast({ title: "Bairro cadastrado com sucesso!" });
      }
      setNeighborhoodDialogOpen(false);
      setEditingNeighborhood(null);
      setNeighborhoodForm({ city_id: "", name: "", delivery_fee: 0, is_active: true });
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao salvar bairro", description: error.message, variant: "destructive" });
    }
  };

  const handleEditNeighborhood = (neighborhood: Neighborhood) => {
    setEditingNeighborhood(neighborhood);
    setNeighborhoodForm({
      city_id: neighborhood.city_id,
      name: neighborhood.name,
      delivery_fee: neighborhood.delivery_fee,
      is_active: neighborhood.is_active,
    });
    setNeighborhoodDialogOpen(true);
  };

  const handleAddNeighborhoodToCity = (cityId: string) => {
    setNeighborhoodForm({ ...neighborhoodForm, city_id: cityId });
    setNeighborhoodDialogOpen(true);
  };

  const handleToggleNeighborhoodStatus = async (neighborhood: Neighborhood) => {
    try {
      const { error } = await supabase
        .from("neighborhoods")
        .update({ is_active: !neighborhood.is_active })
        .eq("id", neighborhood.id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from(itemToDelete.type === "city" ? "cities" : "neighborhoods")
        .delete()
        .eq("id", itemToDelete.id);

      if (error) throw error;
      toast({ title: `${itemToDelete.type === "city" ? "Cidade" : "Bairro"} excluído com sucesso!` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const getNeighborhoodsForCity = (cityId: string) => {
    return neighborhoods.filter((n) => n.city_id === cityId);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 p-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mb-4"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Cidades e Regiões</h1>
              <p className="text-muted-foreground">Gerencie as áreas de atuação do delivery</p>
            </div>
            <Dialog open={cityDialogOpen} onOpenChange={(open) => {
              setCityDialogOpen(open);
              if (!open) {
                setEditingCity(null);
                setCityForm({ name: "", state: "", is_active: true });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Cidade
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCity ? "Editar Cidade" : "Nova Cidade"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome da Cidade</Label>
                    <Input
                      value={cityForm.name}
                      onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={cityForm.state}
                      onValueChange={(value) => setCityForm({ ...cityForm, state: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAZILIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cityForm.is_active}
                      onCheckedChange={(checked) => setCityForm({ ...cityForm, is_active: checked })}
                    />
                    <Label>Cidade ativa</Label>
                  </div>
                  <Button onClick={handleSaveCity} className="w-full">
                    {editingCity ? "Salvar Alterações" : "Cadastrar Cidade"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{cities.length}</p>
                    <p className="text-sm text-muted-foreground">Cidades cadastradas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <Building2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{neighborhoods.length}</p>
                    <p className="text-sm text-muted-foreground">Bairros cadastrados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <MapPin className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{cities.filter(c => c.is_active).length}</p>
                    <p className="text-sm text-muted-foreground">Cidades ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cities List */}
          <Card>
            <CardHeader>
              <CardTitle>Cidades e Bairros</CardTitle>
            </CardHeader>
            <CardContent>
              {cities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma cidade cadastrada</p>
                  <p className="text-sm">Clique em "Nova Cidade" para começar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cities.map((city) => (
                    <Collapsible
                      key={city.id}
                      open={expandedCities.has(city.id)}
                      onOpenChange={() => toggleCityExpanded(city.id)}
                    >
                      <div className="border rounded-lg">
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                          <CollapsibleTrigger className="flex items-center gap-3 flex-1">
                            {expandedCities.has(city.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{city.name}</span>
                              <span className="text-muted-foreground">- {city.state}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                city.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                              }`}>
                                {city.is_active ? "Ativa" : "Inativa"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({getNeighborhoodsForCity(city.id).length} bairros)
                              </span>
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={city.is_active}
                              onCheckedChange={() => handleToggleCityStatus(city)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCity(city)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemToDelete({ type: "city", id: city.id, name: city.name });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <CollapsibleContent>
                          <div className="border-t px-4 py-3 bg-muted/30">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">Bairros</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddNeighborhoodToCity(city.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Adicionar Bairro
                              </Button>
                            </div>
                            {getNeighborhoodsForCity(city.id).length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">
                                Nenhum bairro cadastrado nesta cidade
                              </p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Bairro</TableHead>
                                    <TableHead>Taxa de Entrega</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {getNeighborhoodsForCity(city.id).map((neighborhood) => (
                                    <TableRow key={neighborhood.id}>
                                      <TableCell>{neighborhood.name}</TableCell>
                                      <TableCell>
                                        {neighborhood.delivery_fee > 0
                                          ? `R$ ${neighborhood.delivery_fee.toFixed(2)}`
                                          : "Grátis"}
                                      </TableCell>
                                      <TableCell>
                                        <Switch
                                          checked={neighborhood.is_active}
                                          onCheckedChange={() => handleToggleNeighborhoodStatus(neighborhood)}
                                        />
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditNeighborhood(neighborhood)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setItemToDelete({
                                              type: "neighborhood",
                                              id: neighborhood.id,
                                              name: neighborhood.name,
                                            });
                                            setDeleteDialogOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Neighborhood Dialog */}
      <Dialog
        open={neighborhoodDialogOpen}
        onOpenChange={(open) => {
          setNeighborhoodDialogOpen(open);
          if (!open) {
            setEditingNeighborhood(null);
            setNeighborhoodForm({ city_id: "", name: "", delivery_fee: 0, is_active: true });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNeighborhood ? "Editar Bairro" : "Novo Bairro"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select
                value={neighborhoodForm.city_id}
                onValueChange={(value) => setNeighborhoodForm({ ...neighborhoodForm, city_id: value })}
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
            </div>
            <div className="space-y-2">
              <Label>Nome do Bairro</Label>
              <Input
                value={neighborhoodForm.name}
                onChange={(e) => setNeighborhoodForm({ ...neighborhoodForm, name: e.target.value })}
                placeholder="Ex: Centro"
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa de Entrega (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={neighborhoodForm.delivery_fee}
                onChange={(e) =>
                  setNeighborhoodForm({ ...neighborhoodForm, delivery_fee: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={neighborhoodForm.is_active}
                onCheckedChange={(checked) =>
                  setNeighborhoodForm({ ...neighborhoodForm, is_active: checked })
                }
              />
              <Label>Bairro ativo</Label>
            </div>
            <Button onClick={handleSaveNeighborhood} className="w-full">
              {editingNeighborhood ? "Salvar Alterações" : "Cadastrar Bairro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {itemToDelete?.type === "city" ? "a cidade" : "o bairro"}{" "}
              <strong>{itemToDelete?.name}</strong>?
              {itemToDelete?.type === "city" && (
                <span className="block mt-2 text-destructive">
                  Isso também excluirá todos os bairros desta cidade.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Regions;
