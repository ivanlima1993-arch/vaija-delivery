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
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProviderDashboard = () => {
    const { user } = useAuth();
    const [isOnline, setIsOnline] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [providerData, setProviderData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchProviderData();
        }
    }, [user]);

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
            // Em uma implementação real, criaríamos um registro na tabela withdrawals
            // Como estamos em fase de desenvolvimento, vamos simular ou usar uma tabela genérica
            toast.success("Solicitação de saque enviada com sucesso! Prazo de 24h para análise.");
        } catch (error) {
            toast.error("Erro ao solicitar saque");
        }
    };

    const toggleOnline = async (checked: boolean) => {
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

    const REQUESTS = [
        {
            id: "1",
            customer: "João Pereira",
            service: "Instalação de Chuveiro",
            address: "Rua das Flores, 123",
            time: "Há 5 min",
            price: "R$ 80,00",
            status: "pending",
        },
    ];

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
                    {!providerData?.is_active && (
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
                                    <Button 
                                        variant="secondary" 
                                        className="w-full mt-6 bg-white text-primary hover:bg-white/90 font-black h-12 rounded-2xl text-sm shadow-xl"
                                        onClick={handleWithdrawalRequest}
                                        disabled={!providerData?.is_active}
                                    >
                                        SOLICITAR SAQUE
                                    </Button>
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
                            {REQUESTS.map((req) => (
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
                                                        <Badge className={req.status === 'pending' ? 'bg-amber-500' : 'bg-primary'}>
                                                            {req.status === 'pending' ? 'NOVA SOLICITAÇÃO' : 'EM ANDAMENTO'}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground font-bold">{req.time}</span>
                                                    </div>
                                                    <h3 className="font-black text-lg">{req.service}</h3>
                                                </div>
                                                <p className="text-xl font-black text-primary">{req.price}</p>
                                            </div>

                                            <div className="p-4 bg-muted/30 grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <Briefcase className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black text-muted-foreground">Cliente</p>
                                                        <p className="text-sm font-bold">{req.customer}</p>
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

                                            <div className="p-4 flex gap-3">
                                                {req.status === 'pending' ? (
                                                    <>
                                                        <Button className="flex-1 bg-primary hover:bg-primary/90 font-black h-14 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-white">
                                                            ACEITAR SERVIÇO
                                                        </Button>
                                                        <Button variant="outline" className="w-14 h-14 rounded-2xl border-border/50 hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95 group">
                                                            <XCircle className="w-7 h-7 text-destructive transition-transform group-hover:scale-110" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button className="flex-1 bg-green-600 hover:bg-green-700 font-black h-14 rounded-2xl shadow-lg shadow-green-600/20 transition-all active:scale-95 text-white">
                                                            CONCLUIR SERVIÇO
                                                        </Button>
                                                        <Button variant="secondary" className="w-14 h-14 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95">
                                                            <MessageSquare className="w-7 h-7" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ProviderDashboard;
