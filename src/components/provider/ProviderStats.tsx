import { DollarSign, Briefcase, Star, History, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProviderStatsProps {
    providerData: any;
    onDeposit: () => void;
    onWithdraw: () => void;
    onNavigate: (path: string) => void;
}

const ProviderStats = ({ providerData, onDeposit, onWithdraw, onNavigate }: ProviderStatsProps) => {
    return (
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
                                onClick={onDeposit}
                            >
                                ADICIONAR SALDO
                            </Button>
                            <Button 
                                variant="outline" 
                                className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10 font-black h-12 rounded-2xl text-sm"
                                onClick={onWithdraw}
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
                <Card 
                    className="border-none shadow-soft hover:shadow-lg transition-all cursor-pointer active:scale-95 group"
                    onClick={() => {}}
                >
                    <CardContent className="pt-6 text-primary">
                        <div className="flex flex-col gap-2">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                <Star className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black italic">{providerData?.rating?.toFixed(1) || "5.0"}</p>
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
                            <Button 
                                variant="ghost" 
                                className="w-full justify-start font-black text-xs h-11 rounded-xl gap-3 hover:bg-primary/5 hover:text-primary transition-all active:scale-98"
                                onClick={() => onNavigate('/carteira')}
                            >
                                <History className="w-5 h-5" /> Histórico de Ganhos
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="w-full justify-start font-black text-xs h-11 rounded-xl gap-3 hover:bg-primary/5 hover:text-primary transition-all active:scale-98"
                                onClick={() => onNavigate('/perfil')}
                            >
                                <Settings className="w-5 h-5" /> Configurações Gerais
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProviderStats;
