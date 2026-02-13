
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    const [cpf, setCpf] = useState("");
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
                .select("wallet_balance, cpf_cnpj")
                .eq("user_id", user!.id)
                .single();

            if (profile) {
                setBalance(Number(profile.wallet_balance));
                setCpf(profile.cpf_cnpj || "");
            }

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
        if (isNaN(amount) || amount < 15) {
            toast.error("O valor mínimo para recarga é R$ 15,00");
            return;
        }

        if (!cpf || cpf.length < 11) {
            toast.error("Informe um CPF/CNPJ válido para continuar");
            return;
        }

        setIsCreatingRecharge(true);
        try {
            // First update profile with CPF if it changed or was empty
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ cpf_cnpj: cpf })
                .eq("user_id", user!.id);

            if (updateError) {
                console.error("Error updating CPF:", updateError);
            }

            const { data, error: invokeError } = await supabase.functions.invoke("asaas-payment", {
                body: {
                    action: "create_recharge",
                    amount,
                    billingType: "PIX",
                    cpfCnpj: cpf
                }
            });

            if (invokeError) {
                console.error("Invoke error:", invokeError);
                throw new Error(`Erro na conexão: ${invokeError.message}`);
            }

            if (data?.error) {
                console.error("Function error:", data.error);
                throw new Error(data.error);
            }

            setPixData({
                paymentId: data.paymentId,
                pixQrCode: data.pixQrCode,
                pixCopyPaste: data.pixCopyPaste,
            });
            setRechargeModalOpen(true);
        } catch (error: any) {
            console.error("Complete error details:", error);
            toast.error(error.message || "Erro inesperado ao processar recarga");
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

                    <Card className="bg-primary text-primary-foreground mb-8 overflow-hidden relative">
                        {/* Decorative background circles */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                        <CardHeader>
                            <CardTitle className="text-lg opacity-90 flex items-center gap-2">
                                <WalletIcon className="h-5 w-5" />
                                Saldo Disponível
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="space-y-4 mb-8">
                                <div className="space-y-2">
                                    <Label className="text-white/90">Valor da Recarga (R$)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-bold">R$</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={rechargeAmount}
                                            onChange={(e) => setRechargeAmount(e.target.value)}
                                            className="bg-white/10 border-white/20 text-white text-2xl font-bold pl-10 h-14 focus:bg-white/20 transition-all placeholder:text-white/30"
                                            placeholder="0,00"
                                        />
                                    </div>
                                    <p className="text-xs text-white/60 mt-1">* Valor mínimo para recarga: R$ 15,00</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white/90">CPF ou CNPJ (apenas números)</Label>
                                    <Input
                                        type="text"
                                        value={cpf}
                                        onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                                        className="bg-white/10 border-white/20 text-white h-12 focus:bg-white/20 transition-all placeholder:text-white/30"
                                        placeholder="00000000000"
                                        maxLength={14}
                                    />
                                </div>

                                <div className="p-4 bg-white/10 rounded-xl border border-white/10">
                                    <p className="text-sm opacity-80 mb-1">Seu saldo atual</p>
                                    <p className="text-3xl font-bold text-white">R$ {balance.toFixed(2).replace(".", ",")}</p>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-white text-primary hover:bg-white/90 h-12 text-lg font-bold shadow-lg"
                                onClick={() => handleRecharge()}
                                disabled={isCreatingRecharge}
                            >
                                {isCreatingRecharge ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5 mr-3" />}
                                Recarregar Agora
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Histórico de Transações
                            </CardTitle>
                            <CardDescription>Suas últimas movimentações na carteira</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                    <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                            <div className="flex gap-4 items-center">
                                                <div className={`p-2 rounded-full ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    <Plus className={`h-4 w-4 ${tx.type === 'debit' ? 'rotate-45' : ''}`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm sm:text-base">
                                                        {tx.description || (tx.type === 'credit' ? 'Recarga de Saldo' : 'Pagamento de Pedido')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleString("pt-BR")}
                                                    </p>
                                                </div>
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
