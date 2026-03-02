import { useState } from "react";
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
    Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const ProviderDashboard = () => {
    const [isOnline, setIsOnline] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
        {
            id: "2",
            customer: "Maria Souza",
            service: "Reparo em Tomada",
            address: "Av. Principal, 444",
            time: "Agendado para 14:00",
            price: "R$ 60,00",
            status: "accepted",
        },
    ];

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
                                <h1 className="font-bold text-lg">Painel do Profissional</h1>
                                <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                                    Eletricista Verificado
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{isOnline ? "Online" : "Subordinado"}</span>
                                <Switch
                                    checked={isOnline}
                                    onCheckedChange={setIsOnline}
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
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-none shadow-soft">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black">12</p>
                                        <p className="text-xs text-muted-foreground font-bold">Serviços/Mês</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-soft">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-100 rounded-xl text-green-600">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black">R$ 1.250</p>
                                        <p className="text-xs text-muted-foreground font-bold">Ganhos</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Service Requests */}
                    <section className="space-y-4">
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
                                                        <Button className="flex-1 bg-primary hover:bg-primary/90 font-black h-12 rounded-xl">
                                                            ACEITAR SERVIÇO
                                                        </Button>
                                                        <Button variant="outline" className="w-12 h-12 rounded-xl border-accent-foreground/10">
                                                            <XCircle className="w-6 h-6 text-destructive" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button className="flex-1 bg-green-600 hover:bg-green-700 font-black h-12 rounded-xl">
                                                            CONCLUIR SERVIÇO
                                                        </Button>
                                                        <Button variant="secondary" className="w-12 h-12 rounded-xl">
                                                            <MessageSquare className="w-6 h-6" />
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
