import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, Wallet, ArrowDownCircle, Clock, CheckCircle } from "lucide-react";
import { useEstablishment } from "@/hooks/useEstablishment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EstablishmentWithdrawals = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { establishment, loading } = useEstablishment();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (establishment) {
      fetchWithdrawals();
      fetchBalance();
    }
  }, [establishment]);

  const fetchBalance = async () => {
    // Calculate balance from delivered orders minus completed withdrawals
    const { data: orders } = await supabase
      .from("orders")
      .select("total, delivery_fee")
      .eq("establishment_id", establishment!.id)
      .eq("status", "delivered");

    const { data: wds } = await supabase
      .from("establishment_withdrawals")
      .select("amount, status")
      .eq("establishment_id", establishment!.id)
      .in("status", ["completed", "pending"]);

    const totalOrders = (orders || []).reduce((sum, o) => sum + Number(o.total) - Number(o.delivery_fee || 0), 0);
    const totalWithdrawn = (wds || []).reduce((sum, w) => sum + Number(w.amount), 0);
    setBalance(totalOrders - totalWithdrawn);
  };

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from("establishment_withdrawals")
      .select("*")
      .eq("establishment_id", establishment!.id)
      .order("requested_at", { ascending: false });

    setWithdrawals(data || []);
    setLoadingData(false);
  };

  const requestWithdrawal = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Digite um valor válido");
      return;
    }
    if (amount > balance) {
      toast.error("Saldo insuficiente");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("establishment_withdrawals").insert({
      establishment_id: establishment!.id,
      amount,
      status: "pending",
    });

    if (error) {
      toast.error("Erro ao solicitar saque");
    } else {
      toast.success("Saque solicitado com sucesso!");
      setWithdrawAmount("");
      fetchWithdrawals();
      fetchBalance();
    }
    setSubmitting(false);
  };

  const pendingAmount = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Concluído</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <EstablishmentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">Saques</h1>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ {balance.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ {pendingAmount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Em Processamento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Solicitar Saque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor do Saque</label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <Button className="w-full" onClick={requestWithdrawal} disabled={submitting}>
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                {submitting ? "Solicitando..." : "Solicitar Saque"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Saques</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum saque realizado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">R$ {Number(withdrawal.amount).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(withdrawal.requested_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentWithdrawals;
