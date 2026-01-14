import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { toast } from "sonner";
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Menu,
  MapPin,
  Phone,
  Calendar,
  Star,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Establishment = Database["public"]["Tables"]["establishments"]["Row"];

const AdminEstablishments = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [filteredEstablishments, setFilteredEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

    if (user && isAdmin) {
      fetchEstablishments();
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    let filtered = establishments;

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((e) =>
        statusFilter === "approved" ? e.is_approved : !e.is_approved
      );
    }

    setFilteredEstablishments(filtered);
  }, [establishments, searchTerm, statusFilter]);

  const fetchEstablishments = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEstablishments(data || []);
    } catch (error) {
      toast.error("Erro ao carregar estabelecimentos");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ is_approved: true })
        .eq("id", id);

      if (error) throw error;

      setEstablishments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_approved: true } : e))
      );
      toast.success("Estabelecimento aprovado com sucesso!");
    } catch (error) {
      toast.error("Erro ao aprovar estabelecimento");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ is_approved: false })
        .eq("id", id);

      if (error) throw error;

      setEstablishments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_approved: false } : e))
      );
      toast.success("Estabelecimento rejeitado");
    } catch (error) {
      toast.error("Erro ao rejeitar estabelecimento");
    }
  };

  const openDetails = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    setDetailsOpen(true);
  };

  const pendingCount = establishments.filter((e) => !e.is_approved).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingEstablishments={pendingCount}
      />

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
              <div>
                <h1 className="font-bold text-lg">Estabelecimentos</h1>
                <p className="text-sm text-muted-foreground">
                  {establishments.length} cadastrados, {pendingCount} pendentes
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/admin/estabelecimentos/novo")}>
              <Store className="w-4 h-4 mr-2" />
              Novo Estabelecimento
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {filteredEstablishments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum estabelecimento encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estabelecimento</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEstablishments.map((establishment) => (
                        <TableRow key={establishment.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {establishment.logo_url ? (
                                <img
                                  src={establishment.logo_url}
                                  alt={establishment.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                  <Store className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{establishment.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(establishment.created_at).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{establishment.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{establishment.neighborhood || "-"}</p>
                              <p className="text-muted-foreground">{establishment.city || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={establishment.is_approved ? "default" : "secondary"}
                              className={
                                establishment.is_approved
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }
                            >
                              {establishment.is_approved ? "Aprovado" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDetails(establishment)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!establishment.is_approved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                  onClick={() => handleApprove(establishment.id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {establishment.is_approved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleReject(establishment.id)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedEstablishment?.logo_url ? (
                <img
                  src={selectedEstablishment.logo_url}
                  alt={selectedEstablishment.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Store className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              {selectedEstablishment?.name}
            </DialogTitle>
            <DialogDescription>
              Detalhes do estabelecimento
            </DialogDescription>
          </DialogHeader>

          {selectedEstablishment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{selectedEstablishment.category}</Badge>
                  <Badge
                    variant={selectedEstablishment.is_approved ? "default" : "secondary"}
                  >
                    {selectedEstablishment.is_approved ? "Aprovado" : "Pendente"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedEstablishment.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>

              {selectedEstablishment.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedEstablishment.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div className="text-sm">
                    <p>{selectedEstablishment.address || "Endereço não informado"}</p>
                    <p className="text-muted-foreground">
                      {selectedEstablishment.neighborhood}, {selectedEstablishment.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedEstablishment.phone || "Não informado"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">
                    {selectedEstablishment.rating || 0} ({selectedEstablishment.total_reviews || 0} avaliações)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold">
                    R$ {Number(selectedEstablishment.delivery_fee || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Taxa entrega</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">
                    R$ {Number(selectedEstablishment.min_order_value || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Pedido mínimo</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {selectedEstablishment.min_delivery_time}-{selectedEstablishment.max_delivery_time}min
                  </p>
                  <p className="text-xs text-muted-foreground">Tempo entrega</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedEstablishment && !selectedEstablishment.is_approved && (
              <Button
                onClick={() => {
                  handleApprove(selectedEstablishment.id);
                  setDetailsOpen(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
            )}
            {selectedEstablishment && selectedEstablishment.is_approved && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleReject(selectedEstablishment.id);
                  setDetailsOpen(false);
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Revogar Aprovação
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEstablishments;
