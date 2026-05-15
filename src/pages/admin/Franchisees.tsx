import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";

const AdminFranchisees = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form State
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [commissionRate, setCommissionRate] = useState("5");

  const queryClient = useQueryClient();

  // Buscar franqueados
  const { data: franchisees, isLoading } = useQuery({
    queryKey: ["admin-franchisees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchisees")
        .select(`
          *,
          user:user_id (
            profiles ( full_name, email, phone )
          )
        `);
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar todos os usuários (para poder selecionar quem será franqueado)
  const { data: users } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  // Buscar cidades
  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Criar Franqueado
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !selectedCity || !commissionRate) {
        throw new Error("Preencha todos os campos");
      }

      // 1. Adicionar Role 'franchisee' se não tiver
      await supabase.from("user_roles").insert({
        user_id: selectedUser,
        role: "franchisee" as any,
      }).catch(e => {
        // Ignora erro se já existir a role
        if (e.code !== '23505') console.error(e);
      });

      // 2. Criar registro do franqueado
      const { error: fError } = await supabase.from("franchisees").insert({
        user_id: selectedUser,
        commission_rate: parseFloat(commissionRate),
        active: true
      });

      if (fError && fError.code !== '23505') throw fError;

      // 3. Vincular cidade ao franqueado
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
      // Reset form
      setSelectedUser("");
      setSelectedCity("");
      setCommissionRate("5");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar franqueado");
    }
  });

  // Remover Franqueado
  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Remover vínculo da cidade
      await supabase.from("cities").update({ franchisee_id: null }).eq("franchisee_id", userId);
      // Remover registro
      await supabase.from("franchisees").delete().eq("user_id", userId);
      // Remover role
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "franchisee");
    },
    onSuccess: () => {
      toast.success("Franqueado removido");
      queryClient.invalidateQueries({ queryKey: ["admin-franchisees"] });
    }
  });

  const handleCreate = () => {
    createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 overflow-x-hidden">
        <header className="bg-card border-b p-4 lg:hidden flex items-center justify-between">
          <h1 className="font-bold text-lg">Franqueados</h1>
          <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(true)}>
            Menu
          </Button>
        </header>

        <div className="p-4 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">Gerenciar Franqueados</h1>
              <p className="text-muted-foreground">Administre os donos de franquias regionais</p>
            </div>
            <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Novo Franqueado
            </Button>
          </div>

          <div className="bg-card rounded-xl shadow-soft border p-4">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                    </TableRow>
                  ) : franchisees?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum franqueado encontrado.</TableCell>
                    </TableRow>
                  ) : (
                    franchisees?.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">
                          {/* @ts-ignore */}
                          {f.user?.profiles?.[0]?.full_name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {/* @ts-ignore */}
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
                              if(window.confirm("Remover este franqueado?")) {
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
                    {users?.map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.full_name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">O usuário precisa já ter criado uma conta normal no aplicativo.</p>
              </div>

              <div className="space-y-2">
                <Label>Cidade/Região</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cidade do franqueado" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities?.map(c => (
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
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
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
