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
import { Label } from "@/components/ui/label";
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
  FileText,
  Search,
  Menu,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  DollarSign,
} from "lucide-react";

interface InvoiceWithEstablishment {
  id: string;
  establishment_id: string;
  amount: number;
  due_date: string;
  period: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  establishments: { name: string } | null;
}

const AdminInvoices = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceWithEstablishment[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithEstablishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [establishments, setEstablishments] = useState<{ id: string; name: string }[]>([]);

  // New invoice form state
  const [newInvoice, setNewInvoice] = useState({
    establishment_id: "",
    amount: "",
    due_date: "",
    period: "",
  });

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
      fetchData();
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(
        (inv) =>
          inv.establishments?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.period.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      const [invoicesRes, estRes] = await Promise.all([
        supabase
          .from("establishment_invoices")
          .select("*, establishments(name)")
          .order("due_date", { ascending: false }),
        supabase
          .from("establishments")
          .select("id, name")
          .eq("is_approved", true)
          .order("name"),
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      setInvoices((invoicesRes.data as InvoiceWithEstablishment[]) || []);
      setEstablishments(estRes.data || []);
    } catch (error) {
      toast.error("Erro ao carregar faturas");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === "paid") {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("establishment_invoices")
        .update(updateData)
        .eq("id", invoiceId);

      if (error) throw error;

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, status: newStatus, ...(newStatus === "paid" ? { paid_at: new Date().toISOString() } : {}) }
            : inv
        )
      );
      toast.success(`Fatura marcada como ${getStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error("Erro ao atualizar fatura");
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.establishment_id || !newInvoice.amount || !newInvoice.due_date || !newInvoice.period) {
      toast.error("Preencha todos os campos");
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from("establishment_invoices").insert({
        establishment_id: newInvoice.establishment_id,
        amount: parseFloat(newInvoice.amount),
        due_date: newInvoice.due_date,
        period: newInvoice.period,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Fatura criada com sucesso!");
      setCreateOpen(false);
      setNewInvoice({ establishment_id: "", amount: "", due_date: "", period: "" });
      fetchData();
    } catch (error) {
      toast.error("Erro ao criar fatura");
    } finally {
      setCreating(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Pago";
      case "pending": return "Pendente";
      case "overdue": return "Atrasado";
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "overdue":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === "pending").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    totalAmount: invoices.reduce((sum, i) => sum + Number(i.amount), 0),
    pendingAmount: invoices
      .filter((i) => i.status === "pending" || i.status === "overdue")
      .reduce((sum, i) => sum + Number(i.amount), 0),
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg">Faturas</h1>
                <p className="text-sm text-muted-foreground">
                  {stats.total} faturas, {stats.pending} pendentes
                </p>
              </div>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Fatura
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Faturas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
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
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.overdue}</p>
                    <p className="text-xs text-muted-foreground">Atrasadas</p>
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
                    <p className="text-2xl font-bold">R$ {stats.pendingAmount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">A Receber</p>
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
                    placeholder="Buscar por estabelecimento, período..."
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
                    <SelectItem value="overdue">Atrasadas</SelectItem>
                    <SelectItem value="paid">Pagas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma fatura encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estabelecimento</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <p className="font-medium">{invoice.establishments?.name || "—"}</p>
                          </TableCell>
                          <TableCell>{invoice.period}</TableCell>
                          <TableCell>
                            {new Date(invoice.due_date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <p className="font-bold">R$ {Number(invoice.amount).toFixed(2)}</p>
                          </TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              {invoice.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                    onClick={() => handleStatusChange(invoice.id, "paid")}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Pago
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleStatusChange(invoice.id, "overdue")}
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                    Atrasado
                                  </Button>
                                </>
                              )}
                              {invoice.status === "overdue" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                  onClick={() => handleStatusChange(invoice.id, "paid")}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Marcar Pago
                                </Button>
                              )}
                              {invoice.status === "paid" && (
                                <span className="text-sm text-muted-foreground">
                                  {invoice.paid_at
                                    ? `Pago em ${new Date(invoice.paid_at).toLocaleDateString("pt-BR")}`
                                    : "Pago"}
                                </span>
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

      {/* Create Invoice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Fatura</DialogTitle>
            <DialogDescription>Crie uma nova fatura para um estabelecimento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Estabelecimento</Label>
              <Select
                value={newInvoice.establishment_id}
                onValueChange={(v) => setNewInvoice((prev) => ({ ...prev, establishment_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estabelecimento" />
                </SelectTrigger>
                <SelectContent>
                  {establishments.map((est) => (
                    <SelectItem key={est.id} value={est.id}>
                      {est.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período</Label>
              <Input
                placeholder="Ex: Janeiro 2026"
                value={newInvoice.period}
                onChange={(e) => setNewInvoice((prev) => ({ ...prev, period: e.target.value }))}
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newInvoice.amount}
                onChange={(e) => setNewInvoice((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={newInvoice.due_date}
                onChange={(e) => setNewInvoice((prev) => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateInvoice} disabled={creating}>
              {creating ? "Criando..." : "Criar Fatura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoices;
