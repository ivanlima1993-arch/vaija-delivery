import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  Users,
  Search,
  Menu,
  Shield,
  Store,
  Truck,
  User,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  FileText,
  Camera,
  Clock,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRoles extends Profile {
  roles: AppRole[];
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingEstablishments, setPendingEstablishments] = useState(0);

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
      fetchUsers();
      fetchPendingEstablishments();
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.roles.includes(roleFilter as AppRole));
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const fetchPendingEstablishments = async () => {
    const { count } = await supabase
      .from("establishments")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false);
    setPendingEstablishments(count || 0);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { targetUserId: userToDelete.user_id },
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || "Erro ao excluir usuário");
      }

      setUsers((prev) => prev.filter((u) => u.user_id !== userToDelete.user_id));
      toast.success("Usuário excluído com sucesso");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast.error(error.message || "Erro ao excluir usuário");
    } finally {
      setDeleting(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        ...profile,
        roles: (roles || [])
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role,
      });

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, roles: [...u.roles, role] } : u
        )
      );
      if (selectedUser?.user_id === userId) {
        setSelectedUser({ ...selectedUser, roles: [...selectedUser.roles, role] });
      }
      toast.success(`Role ${role} adicionada com sucesso`);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Usuário já possui esta role");
      } else {
        toast.error("Erro ao adicionar role");
      }
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId
            ? { ...u, roles: u.roles.filter((r) => r !== role) }
            : u
        )
      );
      if (selectedUser?.user_id === userId) {
        setSelectedUser({
          ...selectedUser,
          roles: selectedUser.roles.filter((r) => r !== role),
        });
      }
      toast.success(`Role ${role} removida com sucesso`);
    } catch (error) {
      toast.error("Erro ao remover role");
    }
  };

  const toggleDriverApproval = async (userId: string, currentStatus: boolean, reason?: string) => {
    try {
      const updateData: any = { is_driver_approved: !currentStatus };
      if (currentStatus === true) { // If currently approved and we're disapproving
        updateData.driver_rejection_reason = reason || null;
      } else {
        updateData.driver_rejection_reason = null; // Clear reason on approval
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? {
            ...u,
            is_driver_approved: !currentStatus,
            driver_rejection_reason: updateData.driver_rejection_reason
          } : u
        )
      );
      if (selectedUser?.user_id === userId) {
        setSelectedUser({
          ...selectedUser,
          is_driver_approved: !currentStatus,
          driver_rejection_reason: updateData.driver_rejection_reason
        });
      }
      toast.success(
        `Motorista ${!currentStatus ? "aprovado" : "desaprovado"} com sucesso`
      );
      setIsRejecting(false);
      setRejectionReason("");
    } catch (error) {
      toast.error("Erro ao atualizar status de aprovação");
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case "admin":
        return <Shield className="w-3 h-3" />;
      case "establishment":
        return <Store className="w-3 h-3" />;
      case "driver":
        return <Truck className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "establishment":
        return "default";
      case "driver":
        return "secondary";
      default:
        return "outline";
    }
  };

  const roleLabels: Record<AppRole, string> = {
    admin: "Admin",
    establishment: "Estabelecimento",
    driver: "Entregador",
    customer: "Cliente",
  };

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
        pendingEstablishments={pendingEstablishments}
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
                <h1 className="font-bold text-lg">Usuários</h1>
                <p className="text-sm text-muted-foreground">
                  {users.length} usuários cadastrados
                </p>
              </div>
            </div>
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
                    placeholder="Buscar por nome, telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="establishment">Estabelecimento</SelectItem>
                    <SelectItem value="driver">Entregador</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {userItem.avatar_url ? (
                                <img
                                  src={userItem.avatar_url}
                                  alt={userItem.full_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                  <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{userItem.full_name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{userItem.phone || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userItem.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant={getRoleBadgeVariant(role) as any}
                                  className="flex items-center gap-1"
                                >
                                  {getRoleIcon(role)}
                                  {roleLabels[role]}
                                </Badge>
                              ))}
                              {userItem.roles.length === 0 && (
                                <span className="text-muted-foreground text-sm">
                                  Sem roles
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(userItem.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(userItem);
                                  setRoleDialogOpen(true);
                                }}
                              >
                                Gerenciar Roles
                              </Button>
                              {userItem.roles.includes("driver") && (
                                <Button
                                  variant={userItem.is_driver_approved ? "outline" : "default"}
                                  size="sm"
                                  className={!userItem.is_driver_approved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                                  onClick={() => toggleDriverApproval(userItem.user_id!, userItem.is_driver_approved || false)}
                                >
                                  {userItem.is_driver_approved ? (
                                    <>
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Desaprovar
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Aprovar
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setUserToDelete(userItem);
                                  setDeleteDialogOpen(true);
                                }}
                                disabled={userItem.user_id === user?.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Roles</DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Roles atuais:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma role atribuída</p>
                  ) : (
                    selectedUser.roles.map((role) => (
                      <Badge
                        key={role}
                        variant={getRoleBadgeVariant(role) as any}
                        className="flex items-center gap-2"
                      >
                        {getRoleIcon(role)}
                        {roleLabels[role]}
                        <button
                          onClick={() => removeRole(selectedUser.user_id, role)}
                          className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Adicionar role:</p>
                <div className="flex flex-wrap gap-2">
                  {(["admin", "establishment", "driver", "customer"] as AppRole[])
                    .filter((role) => !selectedUser.roles.includes(role))
                    .map((role) => (
                      <Button
                        key={role}
                        variant="outline"
                        size="sm"
                        onClick={() => addRole(selectedUser.user_id, role)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        {getRoleIcon(role)}
                        {roleLabels[role]}
                      </Button>
                    ))}
                  {selectedUser.roles.length === 4 && (
                    <p className="text-sm text-muted-foreground">
                      Todas as roles já estão atribuídas
                    </p>
                  )}
                </div>
              </div>

              {selectedUser.roles.includes("driver") && (
                <div className="border-t pt-4 mt-4 space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-500" />
                    Dados do Entregador
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.face_photo_url && (
                      <div className="col-span-1 flex flex-col items-center gap-2">
                        <Label className="text-xs text-muted-foreground uppercase self-start">Foto do Rosto</Label>
                        <img
                          src={selectedUser.face_photo_url}
                          alt="Face"
                          className="w-32 h-32 rounded-lg object-cover border-2 border-emerald-100 shadow-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(selectedUser.face_photo_url, '_blank')}
                        >
                          <Camera className="w-3 h-3 mr-1" />
                          Baixar Foto
                        </Button>
                      </div>
                    )}
                    {selectedUser.driver_id_photo_url && (
                      <div className="col-span-1 flex flex-col items-center gap-2">
                        <Label className="text-xs text-muted-foreground uppercase self-start">Foto do RG</Label>
                        <img
                          src={selectedUser.driver_id_photo_url}
                          alt="ID Document"
                          className="w-32 h-32 rounded-lg object-cover border-2 border-blue-100 shadow-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(selectedUser.driver_id_photo_url, '_blank')}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Baixar RG
                        </Button>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        CPF/CNPJ
                      </Label>
                      <p className="text-sm font-medium bg-muted/50 p-2 rounded truncate">
                        {selectedUser.cpf_cnpj || "NÃO INFORMADO"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Placa
                      </Label>
                      <p className="text-sm font-medium bg-muted/50 p-2 rounded truncate">
                        {selectedUser.driver_vehicle_plate || "NÃO INFORMADA"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Nascimento
                      </Label>
                      <p className="text-sm font-medium bg-muted/50 p-2 rounded">
                        {selectedUser.driver_birth_date ? new Date(selectedUser.driver_birth_date).toLocaleDateString("pt-BR") : "NÃO INFORMADA"}
                      </p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Endereço
                      </Label>
                      <p className="text-sm font-medium bg-muted/50 p-2 rounded">
                        {selectedUser.driver_address || "NÃO INFORMADO"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-5 h-5 ${selectedUser.is_driver_approved ? "text-emerald-500" : "text-amber-500"}`} />
                      <div>
                        <p className="text-sm font-bold">Status de Aprovação</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedUser.is_driver_approved ? "Motorista aprovado para entregas" : "Aguardando análise de documentos"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={selectedUser.is_driver_approved || false}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          setIsRejecting(true);
                        } else {
                          toggleDriverApproval(selectedUser.user_id, selectedUser.is_driver_approved || false);
                        }
                      }}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  {isRejecting && (
                    <div className="space-y-3 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-800/20">
                      <Label className="text-xs font-bold text-red-600 uppercase">Motivo da Recusa</Label>
                      <Textarea
                        placeholder="Informe o motivo para o entregador..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="min-h-[80px] bg-background border-red-200 focus-visible:ring-red-500"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => toggleDriverApproval(selectedUser.user_id, selectedUser.is_driver_approved || false, rejectionReason)}
                          disabled={!rejectionReason.trim()}
                        >
                          Confirmar Recusa
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1"
                          onClick={() => {
                            setIsRejecting(false);
                            setRejectionReason("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedUser.driver_rejection_reason && !isRejecting && !selectedUser.is_driver_approved && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800/20">
                      <p className="text-xs font-bold text-red-600 uppercase mb-1">Motivo Atual da Recusa</p>
                      <p className="text-sm italic text-muted-foreground">"{selectedUser.driver_rejection_reason}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário{" "}
              <span className="font-bold text-foreground">
                {userToDelete?.full_name}
              </span>
              ? Esta ação é irreversível e removerá todos os dados vinculados a
              este usuário.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
