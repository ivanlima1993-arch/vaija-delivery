import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  Search,
  Menu,
  Shield,
  Store,
  Truck,
  User,
  Plus,
  Trash2,
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
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
