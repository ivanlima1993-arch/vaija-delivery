import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Wrench,
    Droplets,
    Zap,
    Sparkles,
    Scissors,
    Paintbrush,
    Hammer,
    Bug,
    Leaf,
    Key,
    Laptop,
    Car,
    Snowflake,
    GraduationCap,
    Camera,
    Stethoscope,
    HardHat,
    ArrowLeft,
    Search,
    Star,
    MapPin,
    Clock
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
    { id: 1, name: "Hidráulica", icon: Droplets, color: "text-blue-500", bg: "bg-blue-100" },
    { id: 2, name: "Elétrica", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100" },
    { id: 3, name: "Limpeza", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-100" },
    { id: 4, name: "Beleza", icon: Scissors, color: "text-pink-500", bg: "bg-pink-100" },
    { id: 5, name: "Pintura", icon: Paintbrush, color: "text-orange-500", bg: "bg-orange-100" },
    { id: 6, name: "Reformas", icon: Hammer, color: "text-slate-500", bg: "bg-slate-100" },
    { id: 7, name: "Montagem", icon: Wrench, color: "text-green-500", bg: "bg-green-100" },
    { id: 8, name: "Dedetização", icon: Bug, color: "text-red-500", bg: "bg-red-100" },
    { id: 9, name: "Jardinagem", icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-100" },
    { id: 10, name: "Chaveiro", icon: Key, color: "text-amber-500", bg: "bg-amber-100" },
    { id: 11, name: "Informática", icon: Laptop, color: "text-indigo-500", bg: "bg-indigo-100" },
    { id: 12, name: "Mecânica", icon: Car, color: "text-zinc-500", bg: "bg-zinc-100" },
    { id: 13, name: "Refrigeração", icon: Snowflake, color: "text-sky-500", bg: "bg-sky-100" },
    { id: 14, name: "Aulas", icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-100" },
    { id: 15, name: "Eventos", icon: Camera, color: "text-rose-500", bg: "bg-rose-100" },
    { id: 16, name: "Saúde", icon: Stethoscope, color: "text-teal-500", bg: "bg-teal-100" },
    { id: 17, name: "Pedreiro", icon: HardHat, color: "text-orange-700", bg: "bg-orange-200" },
];

const MOCK_PROS = [
    {
        id: "1",
        name: "Ricardo Silva",
        category: "Eletricista",
        rating: 4.9,
        reviews: 124,
        distance: "1.2 km",
        image: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=400&fit=crop",
        available: true,
    },
    {
        id: "2",
        name: "Ana Oliveira",
        category: "Diarista",
        rating: 5.0,
        reviews: 89,
        distance: "2.5 km",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        available: true,
    },
];

const Services = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [pros, setPros] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedPro, setSelectedPro] = useState<any>(null);
    const [requestData, setRequestData] = useState({
        serviceType: "",
        description: "",
        address: "",
        phone: ""
    });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchPros = async () => {
            try {
                const { data, error } = await supabase
                    .from("service_providers" as any)
                    .select("*")
                    .eq("is_active", true);

                if (error) {
                    console.warn("Table service_providers not found, using mocks");
                    setPros(MOCK_PROS);
                } else if (data && data.length > 0) {
                    setPros(data.map(p => ({
                        ...p,
                        reviews: Math.floor(Math.random() * 100) + 10,
                        distance: (Math.random() * 5 + 1).toFixed(1) + " km",
                        image: p.image_url || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=400&fit=crop",
                        available: p.is_active
                    })));
                } else {
                    setPros(MOCK_PROS);
                }
            } catch (error) {
                setPros(MOCK_PROS);
            } finally {
                setLoading(false);
            }
        };

        fetchPros();

        // If user is logged in, pre-fill phone from profile
        if (user) {
            const fetchProfile = async () => {
                const { data } = await supabase
                    .from("profiles")
                    .select("phone")
                    .eq("user_id", user.id)
                    .single();
                if (data?.phone) {
                    setRequestData(prev => ({ ...prev, phone: data.phone }));
                }
            };
            fetchProfile();
        }
    }, [user]);

    const handleOpenRequest = (pro: any) => {
        if (!user) {
            toast.error("Você precisa estar logado para solicitar um orçamento");
            navigate("/auth");
            return;
        }
        setSelectedPro(pro);
        setRequestData(prev => ({ ...prev, serviceType: pro.category }));
        setIsRequestModalOpen(true);
    };

    const handleSendRequest = async () => {
        if (!requestData.description || !requestData.address || !requestData.phone) {
            toast.error("Por favor, preencha todos os campos");
            return;
        }

        setSending(true);
        try {
            const { error } = await supabase
                .from("service_requests")
                .insert([{
                    customer_id: user?.id,
                    provider_id: selectedPro.id,
                    service_type: requestData.serviceType,
                    description: requestData.description,
                    address: requestData.address,
                    customer_phone: requestData.phone,
                    status: 'pending'
                }]);

            if (error) throw error;

            toast.success("Solicitação enviada! O profissional entrará em contato em breve.");
            setIsRequestModalOpen(false);
            setRequestData({ serviceType: "", description: "", address: "", phone: "" });
        } catch (error: any) {
            console.error("Error sending request:", error);
            toast.error("Erro ao enviar solicitação: " + error.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
                <div className="container flex items-center gap-4 h-16">
                    <Link to="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-display font-bold text-lg text-primary">Vai Já Serviços</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Profissionais Qualificados</p>
                    </div>
                </div>
            </header>

            <main className="container py-6 space-y-8">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="O que você precisa hoje? (Ex: Eletricista)"
                        className="w-full h-14 pl-12 pr-4 bg-card border-none rounded-2xl shadow-soft focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Categories Grid */}
                <section className="space-y-4">
                    <h2 className="font-display font-bold text-xl px-2">Categorias</h2>
                    <div className="grid grid-cols-4 gap-3">
                        {CATEGORIES.map((cat, idx) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex flex-col items-center gap-2 cursor-pointer group"
                            >
                                <div className={`w-14 h-14 ${cat.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                    <cat.icon className={`w-7 h-7 ${cat.color}`} />
                                </div>
                                <span className="text-xs font-bold text-center">{cat.name}</span>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Featured Pros */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="font-display font-bold text-xl">Próximos de você</h2>
                        <Button variant="link" className="text-primary font-bold">Ver todos</Button>
                    </div>

                    <div className="space-y-4">
                        {pros.map((pro, idx) => (
                            <motion.div
                                key={pro.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                onClick={() => handleOpenRequest(pro)}
                            >
                                <Card className="overflow-hidden border-none shadow-soft hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-4 flex gap-4">
                                        <div className="relative">
                                            <img
                                                src={pro.image}
                                                alt={pro.name}
                                                className="w-20 h-20 rounded-2xl object-cover"
                                            />
                                            {pro.available && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-card rounded-full" />
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-lg">{pro.name}</h3>
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                                                    {pro.category}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-bold">{pro.rating}</span>
                                                    <span className="text-muted-foreground text-xs">({pro.reviews})</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="text-xs">{pro.distance}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
                                                    <Clock className="w-3 h-3" />
                                                    DISPONÍVEL AGORA
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Promo Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/95 rounded-3xl p-6 text-white overflow-hidden relative"
                >
                    <div className="relative z-10 space-y-2">
                        <h3 className="text-2xl font-black italic">PROBLEMAS EM CASA?</h3>
                        <p className="text-primary-foreground/90 font-medium">Os melhores profissionais da sua região estão aqui no Vai Já.</p>
                        <Button className="bg-white text-primary hover:bg-white/90 font-black mt-2">
                            SOLICITAR AJUDA AGORA
                        </Button>
                    </div>
                    <Sparkles className="absolute right-[-20px] bottom-[-20px] w-40 h-40 text-white/10 rotate-12" />
                </motion.div>
            </main>

            {/* Request Modal */}
            <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Solicitar Orçamento</DialogTitle>
                        <DialogDescription className="font-bold">
                            Fale com <span className="text-primary">{selectedPro?.name}</span> para resolver seu problema.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">O que você precisa?</Label>
                            <Input 
                                placeholder="Ex: Instalação de fiação" 
                                className="h-12 rounded-xl border-muted font-bold"
                                value={requestData.serviceType}
                                onChange={(e) => setRequestData({ ...requestData, serviceType: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Descrição do Problema</Label>
                            <Textarea 
                                placeholder="Conte em detalhes o que está acontecendo..." 
                                className="rounded-xl border-muted font-medium min-h-[100px]"
                                value={requestData.description}
                                onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Seu Telefone</Label>
                                <Input 
                                    placeholder="(00) 00000-0000" 
                                    className="h-12 rounded-xl border-muted font-bold"
                                    value={requestData.phone}
                                    onChange={(e) => setRequestData({ ...requestData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Seu Endereço</Label>
                                <Input 
                                    placeholder="Rua, Número, Bairro" 
                                    className="h-12 rounded-xl border-muted font-bold"
                                    value={requestData.address}
                                    onChange={(e) => setRequestData({ ...requestData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20"
                            onClick={handleSendRequest}
                            disabled={sending}
                        >
                            {sending ? "ENVIANDO..." : "ENVIAR SOLICITAÇÃO"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Services;
