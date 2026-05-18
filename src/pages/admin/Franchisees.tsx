import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Trash2, CheckCircle, XCircle, Users, MessageCircle, Phone, Mail, MapPin, Clock, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";

// ─── Helpers ────────────────────────────────────────────────────────────────
const getLeadStatusColor = (status: string) => {
  switch (status) {
    case "Novo":        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "Em Contato":  return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "Convertido":  return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Recusado":    return "bg-red-500/10 text-red-500 border-red-500/20";
    default:            return "bg-muted text-muted-foreground";
  }
};

// ─── Main Component ─────────────────────────────────────────────────────────
const AdminFranchisees = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"leads" | "ativos">("leads");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Active franchisee form state
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [commissionRate, setCommissionRate] = useState("5");

  const queryClient = useQueryClient();

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["franchise-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchise_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: franchisees = [], isLoading: franchiseesLoading } = useQuery({
    queryKey: ["admin-franchisees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchisees")
        .select(`*, user:user_id ( profiles ( full_name, email, phone ) )`);
      if (error) throw error;
      return data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("franchise_leads")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["franchise-leads"] });
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("franchise_leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead excluído");
      queryClient.invalidateQueries({ queryKey: ["franchise-leads"] });
    },
    onError: () => toast.error("Erro ao excluir lead"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !selectedCity || !commissionRate) {
        throw new Error("Preencha todos os campos");
      }
      await supabase.from("user_roles").insert({ user_id: selectedUser, role: "franchisee" as any }).catch((e: any) => {
        if (e.code !== "23505") console.error(e);
      });
      const { error: fError } = await supabase.from("franchisees").insert({
        user_id: selectedUser,
        commission_rate: parseFloat(commissionRate),
        active: true,
      });
      if (fError && fError.code !== "23505") throw fError;
      const { error: cError } = await supabase
        .from("cities")
        .update({ franchisee_id: selectedUser })
        .eq("id", selectedCity);
      if (cError) throw cError;
    },
    onSuccess: () => {
      toast.success("Franqueado adicionado com sucesso!");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-franchisees"] });
      setSelectedUser(""); setSelectedCity(""); setCommissionRate("5");
    },
    onError: (error: any) => toast.error(error.message || "Erro ao adicionar franqueado"),
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from("cities").update({ franchisee_id: null }).eq("franchisee_id", userId);
      await supabase.from("franchisees").delete().eq("user_id", userId);
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "franchisee");
    },
    onSuccess: () => {
      toast.success("Franqueado removido");
      queryClient.invalidateQueries({ queryKey: ["admin-franchisees"] });
    },
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const handleWhatsApp = (lead: any) => {
    const phone = lead.phone?.replace(/\D/g, "");
    if (!phone || phone.length < 10) { toast.error("Número inválido"); return; }
    const msg = `Olá ${lead.full_name}! Somos da equipe Vai Já Delivery. Vimos que você tem interesse em ser franqueado na cidade de ${lead.city}. Podemos conversar?`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  // ─── Filtered data ─────────────────────────────────────────────────────────
  const filteredLeads = leads.filter((l: any) =>
    l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFranchisees = franchisees?.filter((f: any) => {
    const name: string = f.user?.profiles?.[0]?.full_name || "";
    const email: string = f.user?.profiles?.[0]?.email || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const newLeadsCount = leads.filter((l: any) => l.status === "Novo").length;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 overflow-x-hidden">
        {/* Mobile header */}
        <header className="bg-card border-b p-4 lg:hidden flex items-center justify-between">
          <h1 className="font-bold text-lg">Franqueados</h1>
          <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(true)}>Menu</Button>
        </header>

        <div className="p-4 md:p-8 space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">Gerenciar Franqueados</h1>
              <p className="text-muted-foreground">Leads da landing page e franqueados ativos</p>
            </div>
            <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Novo Franqueado
            </Button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Leads Novos", value: newLeadsCount, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Total de Leads", value: leads.length, color: "text-primary", bg: "bg-primary/10" },
              { label: "Franqueados Ativos", value: franchisees?.filter((f: any) => f.active).length || 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Em Contato", value: leads.filter((l: any) => l.status === "Em Contato").length, color: "text-amber-500", bg: "bg-amber-500/10" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Users className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-card rounded-xl shadow-soft border overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("leads")}
                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "leads"
                    ? "bg-primary/5 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Leads da Landing Page
                {newLeadsCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {newLeadsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("ativos")}
                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "ativos"
                    ? "bg-primary/5 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Franqueados Ativos
              </button>
            </div>

            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, e-mail ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* ── LEADS TABLE ── */}
              {activeTab === "leads" && (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                        </TableRow>
                      ) : filteredLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="w-10 h-10 opacity-20" />
                              <p>Nenhum lead encontrado.</p>
                              <p className="text-xs">Os interessados que preencherem o formulário da landing page aparecerão aqui.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLeads.map((lead: any) => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.full_name}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5 text-sm">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Mail className="w-3 h-3" /> {lead.email}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="w-3 h-3" /> {lead.phone}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                {lead.city}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1 text-muted-foreground text-sm">
                                <Clock className="w-3 h-3" />
                                {formatDate(lead.created_at)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={lead.status}
                                onValueChange={(val) => updateLeadStatus.mutate({ id: lead.id, status: val })}
                              >
                                <SelectTrigger className={`w-[140px] h-7 text-xs border ${getLeadStatusColor(lead.status)}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Novo">Novo</SelectItem>
                                  <SelectItem value="Em Contato">Em Contato</SelectItem>
                                  <SelectItem value="Convertido">Convertido</SelectItem>
                                  <SelectItem value="Recusado">Recusado</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-500 hover:bg-green-500/10"
                                  title="Chamar no WhatsApp"
                                  onClick={() => handleWhatsApp(lead)}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10"
                                  title="Excluir lead"
                                  onClick={() => {
                                    if (window.confirm("Excluir este lead?")) deleteLead.mutate(lead.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* ── ACTIVE FRANCHISEES TABLE ── */}
              {activeTab === "ativos" && (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Comissão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {franchiseesLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                        </TableRow>
                      ) : filteredFranchisees?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="w-10 h-10 opacity-20" />
                              <p>Nenhum franqueado ativo.</p>
                              <p className="text-xs">Clique em "Novo Franqueado" para adicionar.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFranchisees?.map((f: any) => (
                          <TableRow key={f.id}>
                            <TableCell className="font-medium">
                              {f.user?.profiles?.[0]?.full_name || "N/A"}
                            </TableCell>
                            <TableCell>
                              {f.user?.profiles?.[0]?.email || "N/A"}
                            </TableCell>
                            <TableCell>{f.commission_rate}%</TableCell>
                            <TableCell>
                              {f.active ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                                  <CheckCircle className="w-3 h-3" /> Ativo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                  <XCircle className="w-3 h-3" /> Inativo
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                title="Remover"
                                onClick={() => {
                                  if (window.confirm("Remover este franqueado?")) {
                                    removeMutation.mutate(f.user_id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Novo Franqueado */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Franqueado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Selecionar Usuário</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário já cadastrado" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((u: any) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.full_name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">O usuário precisa já ter criado uma conta no aplicativo.</p>
              </div>
              <div className="space-y-2">
                <Label>Cidade/Região</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cidade do franqueado" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} - {c.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Taxa de Comissão (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Porcentagem que o franqueado ganhará sobre as vendas.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Salvar Franqueado"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminFranchisees;
