
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Wallet as WalletIcon, Plus, History, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AsaasPixModal from "@/components/cart/AsaasPixModal";

const Wallet = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState("50.00");
    const [isCreatingRecharge, setIsCreatingRecharge] = useState(false);
    const [pixData, setPixData] = useState<any>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
            return;
        }
        if (user) {
            fetchWalletData();
        }
    }, [user, authLoading]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const { data: profile } = await supabase
                .from("profiles")
                .select("wallet_balance")
                .eq("user_id", user!.id)
                .single();

            if (profile) setBalance(Number(profile.wallet_balance));

            const { data: txs } = await supabase
                .from("wallet_transactions")
                .select("*")
                .eq("user_id", user!.id)
                .order("created_at", { ascending: false });

            setTransactions(txs || []);
        } catch (error) {
            console.error("Error fetching wallet data:", error);
            toast.error("Erro ao carregar dados da carteira");
        } finally {
            setLoading(false);
        }
    };

    const handleRecharge = async () => {
        const amount = Number(rechargeAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Informe um valor válido");
            return;
        }

        setIsCreatingRecharge(true);
        try {
            const { data, error } = await supabase.functions.invoke("asaas-payment", {
                body: {
                    action: "create_recharge",
                    amount,
                    billingType: "PIX"
                }
            });

            if (error || data?.error) throw new Error(data?.error || "Erro ao criar recarga");

            setPixData({
                paymentId: data.paymentId,
                pixQrCode: data.pixQrCode,
                pixCopyPaste: data.pixCopyPaste,
            });
            setRechargeModalOpen(true);
        } catch (error: any) {
            toast.error(error.message || "Erro ao processar recarga");
        } finally {
            setIsCreatingRecharge(false);
        }
    };

    const handleRechargeConfirmed = () => {
        setRechargeModalOpen(false);
        toast.success("Saldo recarregado com sucesso! 🎉");
        fetchWalletData();
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                    </Button>

                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">Minha Carteira</h1>
                        <WalletIcon className="h-8 w-8 text-primary" />
                    </div>

                    <Card className="bg-primary text-primary-foreground mb-8">
                        <CardHeader>
                            <CardTitle className="text-lg opacity-90">Saldo Disponível</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">R$ {balance.toFixed(2).replace(".", ",")}</p>
                            <div className="mt-6 flex gap-4">
                                <Button
                                    className="bg-white text-primary hover:bg-white/90"
                                    onClick={() => handleRecharge()}
                                    disabled={isCreatingRecharge}
                                >
                                    {isCreatingRecharge ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Recarregar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Histórico
                            </CardTitle>
                            <CardDescription>Suas últimas movimentações</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Nenhuma transação encontrada
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{tx.description || (tx.type === 'credit' ? 'Recarga' : 'Pagamento de Pedido')}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.created_at).toLocaleString("pt-BR")}
                                                </p>
                                            </div>
                                            <p className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'credit' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2).replace(".", ",")}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />

            <AsaasPixModal
                open={rechargeModalOpen}
                onClose={() => setRechargeModalOpen(false)}
                pixData={pixData}
                onPaymentConfirmed={handleRechargeConfirmed}
            />
        </div>
    );
};

export default Wallet;
