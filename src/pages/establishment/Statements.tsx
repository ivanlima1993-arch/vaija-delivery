import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, Receipt, ArrowUpCircle, ArrowDownCircle, Download } from "lucide-react";
import { useEstablishment } from "@/hooks/useEstablishment";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: "credit" | "debit";
  value: number;
}

const EstablishmentStatements = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { establishment, loading } = useEstablishment();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (establishment) fetchTransactions();
  }, [establishment]);

  const fetchTransactions = async () => {
    // Fetch delivered orders as credits
    const { data: orders } = await supabase
      .from("orders")
      .select("id, created_at, order_number, total, delivery_fee, status")
      .eq("establishment_id", establishment!.id)
      .in("status", ["delivered", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch withdrawals as debits
    const { data: withdrawals } = await supabase
      .from("establishment_withdrawals")
      .select("*")
      .eq("establishment_id", establishment!.id)
      .order("requested_at", { ascending: false });

    const txns: Transaction[] = [];

    (orders || []).forEach((order) => {
      if (order.status === "delivered") {
        txns.push({
          id: order.id,
          date: new Date(order.created_at).toLocaleDateString("pt-BR"),
          description: `Pedido #${order.order_number}`,
          type: "credit",
          value: Number(order.total) - Number(order.delivery_fee || 0),
        });
      }
    });

    (withdrawals || []).forEach((w) => {
      txns.push({
        id: w.id,
        date: new Date(w.requested_at).toLocaleDateString("pt-BR"),
        description: `Saque realizado`,
        type: "debit",
        value: Number(w.amount),
      });
    });

    txns.sort((a, b) => b.date.localeCompare(a.date));
    setTransactions(txns);
    setLoadingData(false);
  };

  const credits = transactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.value, 0);
  const debits = transactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.value, 0);
  const balance = credits - debits;

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg">Extratos</h1>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <ArrowUpCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ {credits.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Entradas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <ArrowDownCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ {debits.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Saídas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Receipt className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ {balance.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Saldo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Movimentações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma movimentação registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${transaction.type === "credit" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                          {transaction.type === "credit" ? (
                            <ArrowUpCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                      <p className={`font-bold ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "credit" ? "+" : "-"}R$ {transaction.value.toFixed(2)}
                      </p>
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

export default EstablishmentStatements;
