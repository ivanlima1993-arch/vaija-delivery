import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Wallet, ArrowLeft, Loader2, DollarSign, 
    ArrowUpRight, Clock, CheckCircle2, XCircle, 
    TrendingUp, ShieldCheck, Landmark, Copy, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FranchiseeData {
    id: string;
    user_id: string;
    commission_rate: number;
    bank_account_info: any;
}

interface WithdrawalRequest {
    id: string;
    amount: number;
    status: string;
    requested_at: string;
    processed_at: string | null;
    rejection_reason: string | null;
    pix_key: string | null;
}

const ManageFranchiseeFinancial = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
    const [savingBankInfo, setSavingBankInfo] = useState(false);
    
    const [franchisee, setFranchisee] = useState<FranchiseeData | null>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    
    // Financial calculations
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalCommission, setTotalCommission] = useState(0);
    const [withdrawnAmount, setWithdrawnAmount] = useState(0);
    const [pendingWithdrawalAmount, setPendingWithdrawalAmount] = useState(0);
    const [balance, setBalance] = useState(0);
    
    // Forms state
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [pixKey, setPixKey] = useState("");
    const [bankName, setBankName] = useState("");
    const [pixType, setPixType] = useState("cpf_cnpj");
    const [holderName, setHolderName] = useState("");

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
            return;
        }

        if (user) {
            fetchFinancialData();
        }
    }, [user, authLoading]);

    const fetchFinancialData = async () => {
        try {
            setLoading(true);

            // 1. Fetch franchisee profile
            const { data: franchiseeData, error: fError } = await supabase
                .from("franchisees")
                .select("*")
                .eq("user_id", user!.id)
                .single();

            if (fError) throw fError;
            setFranchisee(franchiseeData);

            // Populate bank form state
            const bankInfo = franchiseeData.bank_account_info || {};
            setPixKey(bankInfo.pix_key || "");
            setBankName(bankInfo.bank_name || "");
            setPixType(bankInfo.pix_key_type || "cpf_cnpj");
            setHolderName(bankInfo.holder_name || "");

            // 2. Fetch managed cities
            const { data: cities, error: citiesError } = await supabase
                .from("cities")
                .select("id")
                .eq("franchisee_id", user!.id);

            if (citiesError) throw citiesError;
            const cityIds = cities?.map(c => c.id) || [];

            let totalRev = 0;
            if (cityIds.length > 0) {
                // 3. Fetch establishments in these cities
                const { data: establishments, error: estError } = await supabase
                    .from("establishments")
                    .select("id")
                    .in("city_id", cityIds);

                if (estError) throw estError;
                const estIds = establishments?.map(e => e.id) || [];

                if (estIds.length > 0) {
                    // 4. Fetch delivered orders for revenue calculation
                    const { data: orders, error: ordersError } = await supabase
                        .from("orders")
                        .select("total")
                        .in("establishment_id", estIds)
                        .eq("status", "delivered");

                    if (ordersError) throw ordersError;
                    totalRev = (orders || []).reduce((sum, o) => sum + Number(o.total || 0), 0);
                }
            }
            setTotalRevenue(totalRev);

            const commRate = franchiseeData.commission_rate || 5;
            const calculatedCommission = totalRev * (commRate / 100);
            setTotalCommission(calculatedCommission);

            // 5. Fetch withdrawals
            const { data: wRes, error: wError } = await supabase
                .from("franchisee_withdrawals" as any)
                .select("*")
                .eq("franchisee_id", user!.id)
                .order("requested_at", { ascending: false });

            if (wError) throw wError;
            const withdrawalsList = (wRes || []) as WithdrawalRequest[];
            setWithdrawals(withdrawalsList);

            // 6. Calculate breakdown
            const totalWithdrawn = withdrawalsList
                .filter(w => w.status === "approved" || w.status === "completed")
                .reduce((sum, w) => sum + Number(w.amount), 0);
            
            const totalPending = withdrawalsList
                .filter(w => w.status === "pending")
                .reduce((sum, w) => sum + Number(w.amount), 0);

            setWithdrawnAmount(totalWithdrawn);
            setPendingWithdrawalAmount(totalPending);
            setBalance(calculatedCommission - totalWithdrawn - totalPending);

        } catch (error: any) {
            toast.error("Erro ao carregar dados financeiros: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBankInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingBankInfo(true);
        try {
            const updatedBankInfo = {
                pix_key: pixKey,
                pix_key_type: pixType,
                bank_name: bankName,
                holder_name: holderName
            };

            const { error } = await supabase
                .from("franchisees")
                .update({ bank_account_info: updatedBankInfo })
                .eq("user_id", user!.id);

            if (error) throw error;
            toast.success("Dados bancários salvos com sucesso!");
        } catch (error: any) {
            toast.error("Erro ao salvar dados bancários: " + error.message);
        } finally {
            setSavingBankInfo(false);
        }
    };

    const handleRequestWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        
        if (isNaN(amount) || amount <= 0) {
            toast.error("Por favor, insira um valor válido de saque.");
            return;
        }

        if (amount > balance) {
            toast.error("Saldo disponível insuficiente para esta solicitação.");
            return;
        }

        if (!pixKey) {
            toast.error("Por favor, configure sua chave Pix antes de solicitar o saque.");
            return;
        }

        setSubmittingWithdrawal(true);
        try {
            const { error } = await supabase
                .from("franchisee_withdrawals" as any)
                .insert({
                    franchisee_id: user!.id,
                    amount: amount,
                    pix_key: pixKey,
                    status: "pending"
                });

            if (error) throw error;

            toast.success("Solicitação de saque enviada com sucesso!");
            setWithdrawAmount("");
            fetchFinancialData();
        } catch (error: any) {
            toast.error("Erro ao solicitar saque: " + error.message);
        } finally {
            setSubmittingWithdrawal(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
            case "approved":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">Aprovado</Badge>;
            case "pending":
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white rounded-full">Pendente</Badge>;
            case "rejected":
                return <Badge variant="destructive" className="rounded-full">Recusado</Badge>;
            default:
                return <Badge variant="secondary" className="rounded-full">{status}</Badge>;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/franqueado")}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black">Gestão Financeira Regional</h1>
                        <p className="text-muted-foreground">Controle de faturamento, comissões regionais e saques.</p>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-none shadow-soft overflow-hidden">
                        <div className="h-1 bg-blue-500 w-full" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Regional</CardTitle>
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">
                                {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Total faturado na região</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-soft overflow-hidden">
                        <div className="h-1 bg-primary w-full" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Comissão Total ({franchisee?.commission_rate || 5}%)</CardTitle>
                            <DollarSign className="w-4 h-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-primary">
                                {totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Total de comissões acumuladas</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-soft overflow-hidden">
                        <div className="h-1 bg-emerald-500 w-full" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Disponível</CardTitle>
                            <Wallet className="w-4 h-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-emerald-600">
                                {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Livre para solicitar saque</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-soft overflow-hidden">
                        <div className="h-1 bg-amber-500 w-full" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Em Processamento / Sacado</CardTitle>
                            <Clock className="w-4 h-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-amber-600">
                                {pendingWithdrawalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sacado: {withdrawnAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Solicitar Saque */}
                    <Card className="border-none shadow-soft lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5 text-primary" />
                                Solicitar Saque
                            </CardTitle>
                            <CardDescription>Envie seu saldo disponível para sua conta cadastrada.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="withdrawAmount">Valor do Saque (R$)</Label>
                                    <Input 
                                        id="withdrawAmount"
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        placeholder="Ex: 150,00"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        disabled={balance <= 0}
                                        className="h-12 rounded-xl"
                                    />
                                </div>
                                <Button 
                                    type="submit" 
                                    className="w-full h-12 rounded-xl font-bold"
                                    disabled={submittingWithdrawal || balance <= 0 || !pixKey}
                                >
                                    {submittingWithdrawal ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Solicitando...
                                        </>
                                    ) : "Solicitar Saque via Pix"}
                                </Button>
                                {!pixKey && (
                                    <p className="text-xs text-red-500 font-semibold text-center">
                                        * Preencha seus dados Pix ao lado antes de solicitar.
                                    </p>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Dados Bancarios */}
                    <Card className="border-none shadow-soft lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Landmark className="w-5 h-5 text-primary" />
                                Configuração de Dados Pix
                            </CardTitle>
                            <CardDescription>Cadastre a chave onde deseja receber suas transferências.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveBankInfo} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="pixType">Tipo de Chave</Label>
                                        <select 
                                            id="pixType"
                                            value={pixType}
                                            onChange={(e) => setPixType(e.target.value)}
                                            className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <option value="cpf_cnpj">CPF / CNPJ</option>
                                            <option value="email">E-mail</option>
                                            <option value="phone">Telefone</option>
                                            <option value="random">Chave Aleatória</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pixKey">Chave Pix</Label>
                                        <Input 
                                            id="pixKey"
                                            placeholder="Insira sua chave Pix"
                                            value={pixKey}
                                            onChange={(e) => setPixKey(e.target.value)}
                                            required
                                            className="h-10 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bankName">Banco</Label>
                                        <Input 
                                            id="bankName"
                                            placeholder="Ex: Nubank, Itaú..."
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="h-10 rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="holderName">Nome do Titular</Label>
                                        <Input 
                                            id="holderName"
                                            placeholder="Nome completo do titular"
                                            value={holderName}
                                            onChange={(e) => setHolderName(e.target.value)}
                                            className="h-10 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    variant="outline" 
                                    className="gap-2"
                                    disabled={savingBankInfo}
                                >
                                    {savingBankInfo ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Salvar Dados Pix
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Histórico de Saques */}
                <Card className="border-none shadow-soft">
                    <CardHeader>
                        <CardTitle>Histórico de Solicitações de Saque</CardTitle>
                        <CardDescription>Acompanhe o status dos seus saques solicitados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Data Solicitação</th>
                                        <th className="px-6 py-4">Chave Pix</th>
                                        <th className="px-6 py-4">Valor</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4">Data Processamento</th>
                                        <th className="px-6 py-4">Observações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                Nenhum saque solicitado até o momento.
                                            </td>
                                        </tr>
                                    ) : (
                                        withdrawals.map((w) => (
                                            <tr key={w.id} className="border-b border-muted/30 hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    {new Date(w.requested_at).toLocaleDateString('pt-BR', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">{w.pix_key || "Não informada"}</td>
                                                <td className="px-6 py-4 font-bold text-primary">
                                                    {Number(w.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="px-6 py-4 text-center">{getStatusBadge(w.status)}</td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {w.processed_at ? new Date(w.processed_at).toLocaleDateString('pt-BR', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric'
                                                    }) : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-red-500 font-medium">
                                                    {w.rejection_reason || "-"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ManageFranchiseeFinancial;
