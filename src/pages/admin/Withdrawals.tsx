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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { toast } from "sonner";
import {
  Search,
  Menu,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  DollarSign,
  AlertTriangle,
  Store,
  ShieldCheck,
} from "lucide-react";

interface WithdrawalWithEstablishment {
  id: string;
  establishment_id: string;
  amount: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
  establishments: { name: string } | null;
}

interface FranchiseeWithdrawal {
  id: string;
  franchisee_id: string;
  amount: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
  pix_key: string | null;
  profiles?: { full_name: string; email: string } | null;
}

interface BankAccount {
  bank_name: string | null;
  agency: string | null;
  account_number: string | null;
  account_type: string | null;
  holder_name: string | null;
  holder_document: string | null;
  pix_key_type: string | null;
  pix_key: string | null;
}

const AdminWithdrawals = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"establishments" | "franchisees">("establishments");

  // Establishment withdrawals state
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithEstablishment[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<WithdrawalWithEstablishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [selectedEstName, setSelectedEstName] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [withdrawalToReject, setWithdrawalToReject] = useState<string | null>(null);

  // Franchisee withdrawals state
  const [franchiseeWithdrawals, setFranchiseeWithdrawals] = useState<FranchiseeWithdrawal[]>([]);
  const [filteredFranchiseeWithdrawals, setFilteredFranchiseeWithdrawals] = useState<FranchiseeWithdrawal[]>([]);
  const [franchiseeLoading, setFranchiseeLoading] = useState(true);
  const [franchiseeSearch, setFranchiseeSearch] = useState("");
  const [franchiseeStatusFilter, setFranchiseeStatusFilter] = useState("all");
  const [franchiseeRejectDialogOpen, setFranchiseeRejectDialogOpen] = useState(false);
  const [franchiseeWithdrawalToReject, setFranchiseeWithdrawalToReject] = useState<string | null>(null);
  const [franchiseeRejectionReason, setFranchiseeRejectionReason] = useState("");

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
      fetchWithdrawals();
      fetchFranchiseeWithdrawals();
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    let filtered = withdrawals;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((w) =>
        (w.establishments?.name || "").toLowerCase().includes(search)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((w) => w.status === statusFilter);
    }
    setFilteredWithdrawals(filtered);
  }, [withdrawals, searchTerm, statusFilter]);

  useEffect(() => {
    let filtered = franchiseeWithdrawals;
    if (franchiseeSearch) {
      const search = franchiseeSearch.toLowerCase();
      filtered = filtered.filter((w) =>
        (w.profiles?.full_name || "").toLowerCase().includes(search) ||
        (w.profiles?.email || "").toLowerCase().includes(search) ||
        (w.pix_key || "").toLowerCase().includes(search)
      );
    }
    if (franchiseeStatusFilter !== "all") {
      filtered = filtered.filter((w) => w.status === franchiseeStatusFilter);
    }
    setFilteredFranchiseeWithdrawals(filtered);
  }, [franchiseeWithdrawals, franchiseeSearch, franchiseeStatusFilter]);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from("establishment_withdrawals")
        .select("*, establishments(name)")
        .order("requested_at", { ascending: false });

      if (error) throw error;
      setWithdrawals((data as WithdrawalWithEstablishment[]) || []);
    } catch (error) {
      toast.error("Erro ao carregar saques");
    } finally {
      setLoading(false);
    }
  };

  const fetchFranchiseeWithdrawals = async () => {
    try {
      setFranchiseeLoading(true);
      const { data, error } = await supabase
        .from("franchisee_withdrawals" as any)
        .select("*")
        .order("requested_at", { ascending: false });

      if (error) throw error;

      // Fetch profile info for each franchisee
      const withdrawalData = (data || []) as FranchiseeWithdrawal[];
      const franchiseeIds = [...new Set(withdrawalData.map(w => w.franchisee_id))];

      if (franchiseeIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", franchiseeIds);

        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        const enriched = withdrawalData.map(w => ({
          ...w,
          profiles: profileMap.get(w.franchisee_id) || null
        }));
        setFranchiseeWithdrawals(enriched);
      } else {
        setFranchiseeWithdrawals([]);
      }
    } catch (error: any) {
      console.warn("Tabela franchisee_withdrawals não encontrada. Execute o script SQL.", error.message);
      setFranchiseeWithdrawals([]);
    } finally {
      setFranchiseeLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    try {
      const { error } = await supabase
        .from("establishment_withdrawals")
        .update({ status: "approved", processed_at: new Date().toISOString() })
        .eq("id", withdrawalId);
      if (error) throw error;
      setWithdrawals((prev) =>
        prev.map((w) => w.id === withdrawalId ? { ...w, status: "approved", processed_at: new Date().toISOString() } : w)
      );
      toast.success("Saque aprovado com sucesso!");
    } catch (error) {
      toast.error("Erro ao aprovar saque");
    }
  };

  const handleReject = async () => {
    if (!withdrawalToReject) return;
    try {
      const { error } = await supabase
        .from("establishment_withdrawals")
        .update({ status: "rejected", processed_at: new Date().toISOString() })
        .eq("id", withdrawalToReject);
      if (error) throw error;
      setWithdrawals((prev) =>
        prev.map((w) => w.id === withdrawalToReject ? { ...w, status: "rejected", processed_at: new Date().toISOString() } : w)
      );
      toast.success("Saque rejeitado");
      setRejectDialogOpen(false);
      setWithdrawalToReject(null);
    } catch (error) {
      toast.error("Erro ao rejeitar saque");
    }
  };

  const handleApproveFranchisee = async (withdrawalId: string) => {
    try {
      const { error } = await supabase
        .from("franchisee_withdrawals" as any)
        .update({ status: "approved", processed_at: new Date().toISOString() })
        .eq("id", withdrawalId);
      if (error) throw error;
      setFranchiseeWithdrawals((prev) =>
        prev.map((w) => w.id === withdrawalId ? { ...w, status: "approved", processed_at: new Date().toISOString() } : w)
      );
      toast.success("Saque do franqueado aprovado!");
    } catch (error) {
      toast.error("Erro ao aprovar saque");
    }
  };

  const handleRejectFranchisee = async () => {
    if (!franchiseeWithdrawalToReject) return;
    try {
      const { error } = await supabase
        .from("franchisee_withdrawals" as any)
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
          rejection_reason: franchiseeRejectionReason || "Recusado pelo administrador."
        })
        .eq("id", franchiseeWithdrawalToReject);
      if (error) throw error;
      setFranchiseeWithdrawals((prev) =>
        prev.map((w) => w.id === franchiseeWithdrawalToReject
          ? { ...w, status: "rejected", processed_at: new Date().toISOString(), rejection_reason: franchiseeRejectionReason }
          : w
        )
      );
      toast.success("Saque recusado");
      setFranchiseeRejectDialogOpen(false);
      setFranchiseeWithdrawalToReject(null);
      setFranchiseeRejectionReason("");
    } catch (error) {
      toast.error("Erro ao recusar saque");
    }
  };

  const viewBankDetails = async (establishmentId: string, estName: string) => {
    try {
      const { data, error } = await supabase
        .from("establishment_bank_accounts")
        .select("*")
        .eq("establishment_id", establishmentId)
        .maybeSingle();
      if (error) throw error;
      setSelectedBankAccount(data);
      setSelectedEstName(estName);
      setBankDetailsOpen(true);
    } catch (error) {
      toast.error("Erro ao carregar dados bancários");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="rounded-full"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-full">{status}</Badge>;
    }
  };

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === "pending").length,
    approved: withdrawals.filter((w) => w.status === "approved").length,
    rejected: withdrawals.filter((w) => w.status === "rejected").length,
    pendingAmount: withdrawals.filter((w) => w.status === "pending").reduce((sum, w) => sum + Number(w.amount), 0),
    totalApproved: withdrawals.filter((w) => w.status === "approved").reduce((sum, w) => sum + Number(w.amount), 0),
  };

  const fStats = {
    total: franchiseeWithdrawals.length,
    pending: franchiseeWithdrawals.filter((w) => w.status === "pending").length,
    pendingAmount: franchiseeWithdrawals.filter((w) => w.status === "pending").reduce((sum, w) => sum + Number(w.amount), 0),
    totalApproved: franchiseeWithdrawals.filter((w) => w.status === "approved").reduce((sum, w) => sum + Number(w.amount), 0),
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
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">Saques</h1>
              <p className="text-sm text-muted-foreground">
                {stats.pending} estabelecimentos · {fStats.pending} franqueados pendentes
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="establishments" className="gap-2">
                <Store className="w-4 h-4" />
                Estabelecimentos
                {stats.pending > 0 && (
                  <Badge className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0 rounded-full">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="franchisees" className="gap-2">
                <ShieldCheck className="w-4 h-4" />
                Franqueados
                {fStats.pending > 0 && (
                  <Badge className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0 rounded-full">
                    {fStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ─── ESTABLISHMENTS TAB ─── */}
            <TabsContent value="establishments" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Banknote className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Total Saques</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-yellow-500/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.pending}</p>
                        <p className="text-xs text-muted-foreground">Pendentes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">R$ {stats.pendingAmount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Valor Pendente</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">R$ {stats.totalApproved.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Total Aprovado</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por estabelecimento..."
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
                        <SelectItem value="rejected">Rejeitados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card>
                <CardContent className="p-0">
                  {filteredWithdrawals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum saque encontrado</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Estabelecimento</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Solicitado em</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Processado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredWithdrawals.map((withdrawal) => (
                            <TableRow key={withdrawal.id}>
                              <TableCell>
                                <p className="font-medium">{withdrawal.establishments?.name || "—"}</p>
                              </TableCell>
                              <TableCell>
                                <p className="font-bold">R$ {Number(withdrawal.amount).toFixed(2)}</p>
                              </TableCell>
                              <TableCell>
                                {new Date(withdrawal.requested_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit", month: "2-digit", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                              <TableCell>
                                {withdrawal.processed_at
                                  ? new Date(withdrawal.processed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="outline" size="sm"
                                    onClick={() => viewBankDetails(withdrawal.establishment_id, withdrawal.establishments?.name || "")}>
                                    <Banknote className="w-4 h-4 mr-1" />Dados
                                  </Button>
                                  {withdrawal.status === "pending" && (
                                    <>
                                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleApprove(withdrawal.id)}>
                                        <CheckCircle className="w-4 h-4 mr-1" />Aprovar
                                      </Button>
                                      <Button variant="destructive" size="sm"
                                        onClick={() => { setWithdrawalToReject(withdrawal.id); setRejectDialogOpen(true); }}>
                                        <XCircle className="w-4 h-4 mr-1" />Rejeitar
                                      </Button>
                                    </>
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
            </TabsContent>

            {/* ─── FRANCHISEES TAB ─── */}
            <TabsContent value="franchisees" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{fStats.total}</p>
                        <p className="text-xs text-muted-foreground">Total Saques</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-yellow-500/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{fStats.pending}</p>
                        <p className="text-xs text-muted-foreground">Pendentes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">R$ {fStats.pendingAmount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Valor Pendente</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">R$ {fStats.totalApproved.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Total Aprovado</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, email ou chave Pix..."
                        value={franchiseeSearch}
                        onChange={(e) => setFranchiseeSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={franchiseeStatusFilter} onValueChange={setFranchiseeStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="approved">Aprovados</SelectItem>
                        <SelectItem value="rejected">Rejeitados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card>
                <CardContent className="p-0">
                  {franchiseeLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto" />
                    </div>
                  ) : filteredFranchiseeWithdrawals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Nenhum saque de franqueado encontrado</p>
                      <p className="text-sm mt-1">Execute o script <strong>supabase_franchisee_withdrawals.sql</strong> para criar a tabela</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Franqueado</TableHead>
                            <TableHead>Chave Pix</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Solicitado em</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Processado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFranchiseeWithdrawals.map((w) => (
                            <TableRow key={w.id}>
                              <TableCell>
                                <p className="font-medium">{w.profiles?.full_name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{w.profiles?.email || ""}</p>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{w.pix_key || "—"}</span>
                              </TableCell>
                              <TableCell>
                                <p className="font-bold text-primary">R$ {Number(w.amount).toFixed(2)}</p>
                              </TableCell>
                              <TableCell>
                                {new Date(w.requested_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit", month: "2-digit", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {getStatusBadge(w.status)}
                                  {w.rejection_reason && (
                                    <p className="text-xs text-red-500">{w.rejection_reason}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {w.processed_at
                                  ? new Date(w.processed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-2">
                                  {w.status === "pending" && (
                                    <>
                                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleApproveFranchisee(w.id)}>
                                        <CheckCircle className="w-4 h-4 mr-1" />Aprovar
                                      </Button>
                                      <Button variant="destructive" size="sm"
                                        onClick={() => {
                                          setFranchiseeWithdrawalToReject(w.id);
                                          setFranchiseeRejectDialogOpen(true);
                                        }}>
                                        <XCircle className="w-4 h-4 mr-1" />Recusar
                                      </Button>
                                    </>
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
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Bank Details Dialog (Establishments) */}
      <Dialog open={bankDetailsOpen} onOpenChange={setBankDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dados Bancários</DialogTitle>
            <DialogDescription>{selectedEstName}</DialogDescription>
          </DialogHeader>
          {selectedBankAccount ? (
            <div className="space-y-3">
              {selectedBankAccount.pix_key && (
                <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Chave PIX</p>
                  <p className="font-medium">
                    {selectedBankAccount.pix_key_type === "cpf" && "CPF: "}
                    {selectedBankAccount.pix_key_type === "cnpj" && "CNPJ: "}
                    {selectedBankAccount.pix_key_type === "email" && "E-mail: "}
                    {selectedBankAccount.pix_key_type === "phone" && "Telefone: "}
                    {selectedBankAccount.pix_key_type === "random" && "Aleatória: "}
                    {selectedBankAccount.pix_key}
                  </p>
                </div>
              )}
              {selectedBankAccount.bank_name && (
                <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Conta Bancária</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Banco:</span> {selectedBankAccount.bank_name}</p>
                    <p><span className="text-muted-foreground">Agência:</span> {selectedBankAccount.agency || "—"}</p>
                    <p><span className="text-muted-foreground">Conta:</span> {selectedBankAccount.account_number || "—"}</p>
                    <p><span className="text-muted-foreground">Tipo:</span> {selectedBankAccount.account_type === "checking" ? "Corrente" : "Poupança"}</p>
                    <p><span className="text-muted-foreground">Titular:</span> {selectedBankAccount.holder_name || "—"}</p>
                    <p><span className="text-muted-foreground">CPF/CNPJ:</span> {selectedBankAccount.holder_document || "—"}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado bancário cadastrado</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Establishment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Rejeição</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja rejeitar este saque? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject}>Rejeitar Saque</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Franchisee Dialog */}
      <Dialog open={franchiseeRejectDialogOpen} onOpenChange={setFranchiseeRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Saque do Franqueado</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa (opcional). O franqueado poderá visualizar este motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <textarea
              className="w-full border border-input rounded-md p-3 text-sm bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              placeholder="Ex: Chave Pix inválida ou documentação pendente..."
              value={franchiseeRejectionReason}
              onChange={(e) => setFranchiseeRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setFranchiseeRejectDialogOpen(false);
              setFranchiseeRejectionReason("");
            }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejectFranchisee}>Confirmar Recusa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
