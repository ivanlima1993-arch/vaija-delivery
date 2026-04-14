import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Briefcase,
    Clock,
    MapPin,
    CheckCircle2,
    XCircle,
    MessageSquare,
    DollarSign,
    Menu,
    Bell,
    Volume2,
    ShieldCheck,
    AlertCircle,
    History,
    Settings,
    User,
    LogOut,
    Star,
    CreditCard,
    QrCode,
    Copy,
    Check,
    Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProviderDashboard = () => {
    const { user } = useAuth();
    const [isOnline, setIsOnline] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [providerData, setProviderData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [depositValue, setDepositValue] = useState("");
    const [processing, setProcessing] = useState(false);
    const [depositStep, setDepositStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | null>(null);
    const [pixData, setPixData] = useState<any>(null);
    const [cpf, setCpf] = useState("");
    const [cardData, setCardData] = useState({
        holderName: "",
        number: "",
        expiry: "",
        cvv: ""
    });
    const [requests, setRequests] = useState<any[]>([]);
    const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [scheduleDate, setScheduleDate] = useState("");

    useEffect(() => {
        if (user) {
            fetchProviderData();
            fetchRequests();
        }
    }, [user]);

    const fetchRequests = async () => {
        try {
            // First get the provider's ID
            const { data: provider } = await supabase
                .from("service_providers")
                .select("id")
                .eq("user_id", user?.id)
                .single();

            if (!provider) return;

            const { data, error } = await supabase
                .from("service_requests")
                .select("*")
                .eq("provider_id", provider.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    };

    const fetchProviderData = async () => {
        try {
            const { data, error } = await supabase
                .from("service_providers")
                .select("*")
                .eq("user_id", user?.id)
                .maybeSingle();

            if (error) throw error;
            setProviderData(data);
            setIsOnline(data?.is_active || false);

            // Load CPF from profiles table
            const { data: profile } = await supabase
                .from("profiles")
                .select("cpf_cnpj")
                .eq("user_id", user?.id)
                .maybeSingle();
            if (profile?.cpf_cnpj) setCpf(profile.cpf_cnpj);
        } catch (error) {
            console.error("Error fetching provider data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawalRequest = async () => {
        if (!providerData?.wallet_balance || providerData.wallet_balance < 50) {
            toast.error("Saldo mínimo de R$ 50,00 para saque");
            return;
        }

        try {
            toast.success("Solicitação de saque enviada com sucesso! Prazo de 24h para análise.");
        } catch (error) {
            toast.error("Erro ao solicitar saque");
        }
    };

    const handleDeposit = async (method?: "pix" | "card") => {
        const value = parseFloat(depositValue);
        if (isNaN(value) || value <= 0) {
            toast.error("Informe um valor válido");
            return;
        }

        const effectiveMethod = method || paymentMethod;
        if (effectiveMethod) setPaymentMethod(effectiveMethod);

        setProcessing(true);
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            
            const response = await fetch(`${supabaseUrl}/functions/v1/asaas-payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: "create_recharge",
                    amount: value,
                    billingType: effectiveMethod === "pix" ? "PIX" : "CREDIT_CARD",
                    cpfCnpj: cpf.replace(/\D/g, ""),
                    cardInfo: effectiveMethod === 'card' ? {
                        cardHolder: cardData.holderName,
                        cardNumber: cardData.number,
                        expiryMonth: cardData.expiry.split('/')[0],
                        expiryYear: cardData.expiry.split('/')[1],
                        ccv: cardData.cvv,
                    } : undefined,
                    holderInfo: effectiveMethod === 'card' ? {
                        cpfCnpj: cpf.replace(/\D/g, ""),
                        postalCode: '00000000',
                        addressNumber: '0'
                    } : undefined
                })
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || `Erro HTTP ${response.status}: ${JSON.stringify(data) || response.statusText}`);
            }
            if (data?.error) throw new Error(data.error);

            if (effectiveMethod === 'pix') {
                setPixData({
                    encodedImage: data.pixQrCode,
                    payload: data.pixCopyPaste
                });
                setDepositStep(3);
                startStatusCheck(data.paymentId);
            } else {
                toast.success("Pagamento com cartão processado!");
                fetchProviderData(); // Refresh balance
                resetDeposit();
            }
        } catch (error: any) {
            console.error("Payment error full details:", error);
            
            // supabase-js v2 wraps non-2xx responses in a FunctionsHttpError that contains the response object in error.context
            let errorMsg = error.message;
            if (error.context && typeof error.context.text === 'function') {
                try {
                    const errorBody = await error.context.text();
                    errorMsg = `${error.message} - Body: ${errorBody}`;
                } catch (e) {}
            } else if (error.context && typeof error.context.json === 'function') {
                try {
                    const errorJson = await error.context.json();
                    errorMsg = `${error.message} - JSON: ${JSON.stringify(errorJson)}`;
                } catch (e) {}
            }
            
            toast.error("Erro no pagamento: " + errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    const startStatusCheck = (paymentId: string) => {
        const interval = setInterval(async () => {
            const { data: tx } = await supabase
                .from('wallet_transactions')
                .select('status')
                .eq('asaas_payment_id', paymentId)
                .single();

            if (tx?.status === 'confirmed') {
                toast.success("Pagamento via PIX confirmado! Saldo atualizado.");
                fetchProviderData();
                resetDeposit();
                clearInterval(interval);
            }
        }, 5000);

        // Auto-clear after 5 minutes
        setTimeout(() => clearInterval(interval), 300000);
    };

    const resetDeposit = () => {
        setIsDepositOpen(false);
        setDepositValue("");
        setDepositStep(1);
        setPaymentMethod(null);
        setPixData(null);
        setCardData({ holderName: "", number: "", expiry: "", cvv: "" });
    };

    const handleAcceptService = async (requestId: string) => {
        const CALL_FEE = 1.50;
        const MIN_ORDER_BALANCE = 5.00;
        
        if ((providerData?.wallet_balance || 0) < MIN_ORDER_BALANCE) {
            toast.error(`Saldo insuficiente (mínimo R$ ${MIN_ORDER_BALANCE.toFixed(2)}). Recarregue sua carteira.`);
            setIsDepositOpen(true);
            return;
        }

        try {
            setProcessing(true);
            
            // Create a transaction record
            const { error: txError } = await supabase
                .from("wallet_transactions")
                .insert([{
                    user_id: user?.id,
                    amount: CALL_FEE,
                    type: "debit",
                    status: "confirmed",
                    description: `Taxa de serviço - Chamado #${requestId.slice(0, 8)} aceito`
                }]);

            if (txError) throw txError;

            // Update request status
            const { error: reqError } = await supabase
                .from("service_requests")
                .update({ status: 'accepted' })
                .eq("id", requestId);

            if (reqError) throw reqError;

            // Refresh data
            await Promise.all([fetchProviderData(), fetchRequests()]);
            toast.success(`Chamado aceito! Taxa de R$ ${CALL_FEE.toFixed(2)} descontada.`);

        } catch (error: any) {
            console.error("Error accepting service:", error);
            toast.error("Erro ao processar aceitação: " + (error.message || "Tente novamente"));
        } finally {
            setProcessing(false);
        }
    };

    const handleScheduleService = async () => {
        if (!scheduleDate) {
            toast.error("Selecione uma data e horário");
            return;
        }

        const CALL_FEE = 1.50;
        const MIN_ORDER_BALANCE = 5.00;
        
        if ((providerData?.wallet_balance || 0) < MIN_ORDER_BALANCE) {
            toast.error(`Saldo insuficiente (mínimo R$ ${MIN_ORDER_BALANCE.toFixed(2)}). Recarregue sua carteira.`);
            setIsDepositOpen(true);
            return;
        }

        try {
            setProcessing(true);
            
            // Create a transaction record
            const { error: txError } = await supabase
                .from("wallet_transactions")
                .insert([{
                    user_id: user?.id,
                    amount: CALL_FEE,
                    type: "debit",
                    status: "confirmed",
                    description: `Taxa de serviço - Chamado #${selectedRequest.id.slice(0, 8)} agendado`
                }]);

            if (txError) throw txError;

            // Update request status and date
            const { error: reqError } = await supabase
                .from("service_requests")
                .update({ 
                    status: 'scheduled',
                    scheduled_at: new Date(scheduleDate).toISOString()
                })
                .eq("id", selectedRequest.id);

            if (reqError) throw reqError;

            // Refresh data
            await Promise.all([fetchProviderData(), fetchRequests()]);
            toast.success(`Serviço agendado para ${new Date(scheduleDate).toLocaleString()}! Taxa de R$ ${CALL_FEE.toFixed(2)} descontada.`);
            setIsSchedulingOpen(false);
            setSelectedRequest(null);
            setScheduleDate("");

        } catch (error: any) {
            console.error("Error scheduling service:", error);
            toast.error("Erro ao processar agendamento: " + (error.message || "Tente novamente"));
        } finally {
            setProcessing(false);
        }
    };

    const toggleOnline = async (checked: boolean) => {
        if (checked && (providerData?.wallet_balance || 0) < 5.00) {
            toast.error("Saldo mínimo de R$ 5,00 necessário para ficar Online");
            setIsOnline(false);
            return;
        }

        setIsOnline(checked);
        try {
            await supabase
                .from("service_providers")
                .update({ is_active: checked })
                .eq("user_id", user?.id);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const scheduledRequests = requests.filter(r => r.status === 'scheduled');
    const inProgressRequests = requests.filter(r => r.status === 'accepted');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <Menu className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="font-bold text-lg">Olá, {providerData?.name?.split(' ')[0]}!</h1>
                                <div className="flex items-center gap-2">
                                    {providerData?.is_active ? (
                                        <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 gap-1 px-1">
                                            <ShieldCheck className="w-3 h-3" /> Perfil Verificado
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50 gap-1 px-1">
                                            <AlertCircle className="w-3 h-3" /> Aguardando Aprovação
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{isOnline ? "Online" : "Indisponível"}</span>
                                <Switch
                                    checked={isOnline}
                                    onCheckedChange={toggleOnline}
                                    className="data-[state=checked]:bg-green-500"
                                />
                            </div>
                            <Button variant="ghost" size="icon" className="relative text-primary">
                                <Volume2 className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-6 space-y-6">
                    {!providerData?.is_active && providerData?.wallet_balance >= 5 && (
                        <Card className="border-none bg-amber-500/10 border-amber-500/20 text-amber-700">
                            <CardContent className="p-4 flex gap-4 items-center">
                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black uppercase text-xs">Atenção ao seu Perfil</p>
                                    <p className="text-sm font-medium">Seu cadastro está em análise. Você ainda não pode receber novos pedidos, mas pode configurar seu perfil.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {providerData?.wallet_balance < 5 && (
                        <Card className="border-none bg-destructive/10 border-destructive/20 text-destructive">
                            <CardContent className="p-4 flex gap-4 items-center">
                                <div className="w-12 h-12 bg-destructive rounded-2xl flex items-center justify-center text-white shrink-0">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <p className="font-black uppercase text-xs">Saldo Insuficiente</p>
                                    <p className="text-sm font-medium">Você precisa de no mínimo R$ 5,00 para receber novos chamados.</p>
                                </div>
                                <Button 
                                    size="sm" 
                                    className="bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl"
                                    onClick={() => setIsDepositOpen(true)}
                                >
                                    RECARREGAR
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stats & Wallet */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-none shadow-soft bg-gradient-to-br from-primary to-primary-foreground text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                <DollarSign className="w-24 h-24" />
                            </div>
                            <CardContent className="pt-6 relative">
                                <div className="flex flex-col h-full justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase opacity-80 mb-1">Ganhos Disponíveis</p>
                                        <p className="text-4xl font-black italic tracking-tighter">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(providerData?.wallet_balance || 0)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 mt-6">
                                        <Button 
                                            variant="secondary" 
                                            className="flex-1 bg-white text-primary hover:bg-white/90 font-black h-12 rounded-2xl text-sm shadow-xl"
                                            onClick={() => setIsDepositOpen(true)}
                                        >
                                            ADICIONAR SALDO
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10 font-black h-12 rounded-2xl text-sm"
                                            onClick={handleWithdrawalRequest}
                                            disabled={!providerData?.is_active}
                                        >
                                            SAQUE
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-1 lg:col-span-2">
                             <Card className="border-none shadow-soft hover:shadow-lg transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black italic">0</p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Serviços Hoje</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                             <Card className="border-none shadow-soft hover:shadow-lg transition-shadow">
                                <CardContent className="pt-6 text-primary">
                                    <div className="flex flex-col gap-2">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <Star className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black italic">5.0</p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Avaliação</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-none shadow-soft bg-card lg:col-span-1">
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Ações Rápidas</p>
                                    <div className="space-y-2">
                                        <Button variant="ghost" className="w-full justify-start font-black text-xs h-11 rounded-xl gap-3 hover:bg-primary/5 hover:text-primary transition-all active:scale-98">
                                            <History className="w-5 h-5" /> Histórico de Ganhos
                                        </Button>
                                        <Button variant="ghost" className="w-full justify-start font-black text-xs h-11 rounded-xl gap-3 hover:bg-primary/5 hover:text-primary transition-all active:scale-98">
                                            <Settings className="w-5 h-5" /> Configurações Gerais
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Service Requests */}
                    <section className="space-y-4 pt-4">
                        <h2 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
                            <Clock className="w-6 h-6 text-primary" />
                            Solicitações Recentes
                        </h2>

                        <div className="space-y-4">
                            {pendingRequests.length === 0 && (
                                <p className="text-center py-8 text-muted-foreground font-medium italic">Nenhuma nova solicitação no momento.</p>
                            )}
                            {pendingRequests.map((req) => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <Card className="border-none shadow-soft overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="p-4 flex justify-between items-start border-b border-border/50">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className='bg-amber-500'>
                                                            NOVA SOLICITAÇÃO
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground font-bold italic">
                                                            {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-black text-lg">{req.service_type}</h3>
                                                </div>
                                                <p className="text-xl font-black text-primary">
                                                    {req.price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(req.price) : "A combinar"}
                                                </p>
                                            </div>

                                            <div className="p-4 bg-muted/30 grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <Briefcase className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black text-muted-foreground">Cliente</p>
                                                        <p className="text-sm font-bold">{req.customer_name || "Usuário Vai Já"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black text-muted-foreground">Local</p>
                                                        <p className="text-sm font-bold truncate w-32">{req.address}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 flex flex-col gap-3">
                                                <div className="flex gap-3">
                                                    <Button 
                                                        className="flex-1 bg-primary hover:bg-primary/90 font-black h-14 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-white"
                                                        onClick={() => handleAcceptService(req.id)}
                                                    >
                                                        ACEITAR AGORA
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        className="flex-1 border-primary text-primary hover:bg-primary/5 font-black h-14 rounded-2xl transition-all active:scale-95"
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setIsSchedulingOpen(true);
                                                        }}
                                                    >
                                                        <CalendarIcon className="w-4 h-4 mr-2" /> AGENDAR
                                                    </Button>
                                                </div>
                                                <Button variant="ghost" className="w-full text-destructive font-bold h-10 hover:bg-destructive/5">
                                                    RECUSAR CHAMADO
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Scheduled Services / Agenda */}
                    <section className="space-y-4 pt-4">
                        <h2 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-primary" />
                            Minha Agenda
                        </h2>
                        <div className="space-y-4">
                             {scheduledRequests.length === 0 && (
                                <p className="text-center py-8 text-muted-foreground font-medium italic">Sua agenda está vazia.</p>
                            )}
                            {scheduledRequests.map((req) => (
                                <Card key={req.id} className="border-none shadow-soft overflow-hidden">
                                     <div className="bg-primary/10 p-3 px-4 flex justify-between items-center border-b border-primary/20">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-bold text-primary uppercase">
                                                {new Date(req.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <Badge className="bg-primary text-white">AGENDADO</Badge>
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h3 className="font-black text-lg">{req.service_type}</h3>
                                                <p className="text-sm text-muted-foreground">{req.customer_name}</p>
                                            </div>
                                            <Button variant="secondary" size="icon" className="rounded-xl">
                                                <MessageSquare className="w-5 h-5" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                            <MapPin className="w-4 h-4" />
                                            <span className="truncate">{req.address}</span>
                                        </div>
                                        <Button className="w-full bg-green-600 hover:bg-green-700 font-bold h-12 rounded-xl text-white">
                                            INICIAR SERVIÇO AGORA
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
            {/* Deposit Dialog */}
            <Dialog open={isDepositOpen} onOpenChange={(open) => {
                if (!open) resetDeposit();
                else setIsDepositOpen(true);
            }}>
                <DialogContent className="rounded-[2.5rem] max-w-sm overflow-hidden p-0 border-none shadow-2xl">
                    <div className="bg-primary p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <DollarSign className="w-20 h-20" />
                        </div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter mb-2">Recarregar</DialogTitle>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Passo {depositStep} de 3</p>
                    </div>

                    <div className="p-8 space-y-6 bg-card">
                        {depositStep === 1 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1">Valor do Depósito</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-xl">R$</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="0,00"
                                            className="h-16 rounded-2xl text-2xl font-black border-muted pl-12 focus-visible:ring-primary shadow-inner"
                                            value={depositValue}
                                            onChange={(e) => setDepositValue(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {[10, 20, 50].map((v) => (
                                        <Button 
                                            key={v} 
                                            variant="outline" 
                                            className="h-12 rounded-xl font-black border-muted/50 hover:border-primary hover:text-primary transition-all active:scale-95"
                                            onClick={() => setDepositValue(v.toString())}
                                        >
                                            + R$ {v}
                                        </Button>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cpf" className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1">CPF / CNPJ</Label>
                                    <Input
                                        id="cpf"
                                        type="text"
                                        placeholder="000.000.000-00"
                                        maxLength={18}
                                        className="h-12 rounded-2xl border-muted focus-visible:ring-primary"
                                        value={cpf}
                                        onChange={(e) => setCpf(e.target.value.replace(/[^\d.\-\/]/g, ""))}
                                    />
                                    <p className="text-[10px] text-muted-foreground italic pl-1">Necessário para emissão do comprovante via Asaas.</p>
                                </div>

                                <Button 
                                    className="w-full h-16 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20 transition-all active:scale-95"
                                    onClick={() => {
                                        const value = parseFloat(depositValue);
                                        if (isNaN(value) || value <= 0) {
                                            toast.error("Informe um valor válido");
                                            return;
                                        }
                                        const cleanCpf = cpf.replace(/\D/g, "");
                                        if (!cleanCpf || (cleanCpf.length !== 11 && cleanCpf.length !== 14)) {
                                            toast.error("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido");
                                            return;
                                        }
                                        setDepositStep(2);
                                    }}
                                    disabled={processing}
                                >
                                    ESCOLHER FORMA DE PAGAMENTO
                                </Button>
                            </div>
                        )}

                        {depositStep === 2 && (
                            <div className="space-y-4">
                                <p className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-4 pl-1">Escolha a Forma de Pagamento</p>
                                
                                <button 
                                    onClick={() => handleDeposit("pix")}
                                    disabled={processing}
                                    className="w-full flex items-center gap-4 p-5 rounded-2xl border border-muted hover:border-primary hover:bg-primary/5 transition-all text-left group disabled:opacity-60"
                                >
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <QrCode className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-sm uppercase">PIX</p>
                                        <p className="text-xs font-semibold text-muted-foreground">{processing ? "Gerando..." : "Aprovação imediata"}</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => {
                                        setPaymentMethod("card");
                                        setDepositStep(3);
                                    }}
                                    disabled={processing}
                                    className="w-full flex items-center gap-4 p-5 rounded-2xl border border-muted hover:border-primary hover:bg-primary/5 transition-all text-left group disabled:opacity-60"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-sm uppercase">Cartão de Crédito</p>
                                        <p className="text-xs font-semibold text-muted-foreground">Créditos em instantes</p>
                                    </div>
                                </button>

                                <Button variant="ghost" className="w-full font-bold text-muted-foreground" onClick={() => setDepositStep(1)}>Voltar</Button>
                            </div>
                        )}

                        {depositStep === 3 && paymentMethod === "pix" && (
                            <div className="text-center space-y-6">
                                <div className="bg-white p-6 rounded-3xl border shadow-inner inline-block mx-auto mb-2">
                                    {pixData?.encodedImage ? (
                                        <img 
                                            src={`data:image/png;base64,${pixData.encodedImage}`} 
                                            alt="Pix QR Code" 
                                            className="w-48 h-48"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 flex items-center justify-center">
                                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Escaneie o QR Code acima</p>
                                    <Button 
                                        variant="secondary" 
                                        className="w-full h-14 rounded-2xl flex items-center gap-3 font-black text-xs px-2"
                                        onClick={() => {
                                            if (pixData?.payload) {
                                                navigator.clipboard.writeText(pixData.payload);
                                                toast.success("Chave PIX copiada!");
                                            }
                                        }}
                                    >
                                        <Copy className="w-4 h-4" /> COPIAR CHAVE PIX (COPIA E COLA)
                                    </Button>
                                </div>
                                <div className="pt-4 flex flex-col gap-3">
                                    <p className="text-xs text-muted-foreground italic">Aguardando confirmação automática...</p>
                                    <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => setDepositStep(2)}>Trocar Forma</Button>
                                </div>
                            </div>
                        )}

                        {depositStep === 3 && paymentMethod === "card" && (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white relative overflow-hidden h-44 flex flex-col justify-between shadow-2xl mb-6">
                                     <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <div className="flex -space-x-2">
                                            <div className="w-8 h-8 rounded-full bg-red-500" />
                                            <div className="w-8 h-8 rounded-full bg-yellow-500" />
                                        </div>
                                     </div>
                                     <div className="w-10 h-7 bg-yellow-500/20 rounded-md border border-yellow-500/50" />
                                     <div className="space-y-1">
                                        <p className="text-lg font-mono tracking-widest">**** **** **** ****</p>
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] uppercase font-bold opacity-60 italic">NOME NO CARTÃO</p>
                                            <p className="text-xs font-mono opacity-80">MM/AA</p>
                                        </div>
                                     </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Nome no Cartão</Label>
                                        <Input 
                                            placeholder="Ex: João Silva" 
                                            className="h-12 rounded-xl border-muted font-bold" 
                                            value={cardData.holderName}
                                            onChange={(e) => setCardData({ ...cardData, holderName: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Número do Cartão</Label>
                                        <Input 
                                            placeholder="0000 0000 0000 0000" 
                                            className="h-12 rounded-xl border-muted font-bold" 
                                            value={cardData.number}
                                            onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Validade</Label>
                                        <Input 
                                            placeholder="MM/AA" 
                                            className="h-12 rounded-xl border-muted font-bold" 
                                            value={cardData.expiry}
                                            onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">CVV</Label>
                                        <Input 
                                            placeholder="123" 
                                            className="h-12 rounded-xl border-muted font-bold" 
                                            value={cardData.cvv}
                                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex flex-col gap-3">
                                    <Button 
                                        className="w-full h-16 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20"
                                        onClick={handleDeposit}
                                        disabled={processing}
                                    >
                                        {processing ? "PROCESSANDO..." : "PAGAR R$ " + parseFloat(depositValue).toFixed(2)}
                                    </Button>
                                    <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => setDepositStep(2)}>Trocar Forma</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {/* Scheduling Dialog */}
            <Dialog open={isSchedulingOpen} onOpenChange={setIsSchedulingOpen}>
                <DialogContent className="max-w-sm rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Agendar Serviço</DialogTitle>
                        <DialogDescription className="font-bold">Escolha a melhor data e horário para este atendimento.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Data e Hora</Label>
                            <Input 
                                type="datetime-local" 
                                className="h-14 rounded-2xl font-bold border-muted"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                        </div>
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-xs font-medium text-primary">
                            <p>Será cobrada a taxa de **R$ 1,50** após a confirmação do agendamento.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20"
                            onClick={handleScheduleService}
                            disabled={processing}
                        >
                            {processing ? "PROCESSANDO..." : "CONFIRMAR AGENDAMENTO"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProviderDashboard;
