import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
    Wrench, 
    ArrowLeft, 
    User, 
    Phone, 
    Briefcase, 
    FileText, 
    CheckCircle2,
    HardHat,
    Hammer,
    Paintbrush,
    Zap,
    Droplets
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
    "Hidráulica",
    "Elétrica",
    "Limpeza",
    "Beleza",
    "Pintura",
    "Reformas",
    "Montagem",
    "Dedetização",
    "Jardinagem",
    "Chaveiro",
    "Informática",
    "Mecânica",
    "Refrigeração",
    "Aulas",
    "Eventos",
    "Saúde",
    "Pedreiro",
];

const ProviderAuth = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        category: "",
        description: "",
        email: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.phone || !formData.category) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from("service_providers" as any)
                .insert([{
                    id: crypto.randomUUID(),
                    name: formData.name,
                    full_name: formData.name,
                    phone: formData.phone,
                    category: formData.category,
                    description: formData.description,
                    email: formData.email,
                    is_active: false // Começa como inativo para aprovação do admin
                }]);

            if (error) throw error;

            setSubmitted(true);
            toast.success("Cadastro enviado com sucesso!");
        } catch (error: any) {
            console.error("Erro no cadastro:", error);
            toast.error("Erro ao enviar cadastro: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Recebemos seu Cadastro!</h1>
                        <p className="text-muted-foreground font-medium">
                            Nossa equipe analisará seus dados e entrará em contato via WhatsApp em até 24h para ativar seu perfil.
                        </p>
                    </div>
                    <Button 
                        onClick={() => navigate("/")}
                        className="w-full bg-primary hover:bg-primary/90 font-black h-14 rounded-2xl text-lg"
                    >
                        VOLTAR PARA O INÍCIO
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]" />
            </div>

            <header className="container py-8 relative">
                <Link to="/">
                    <Button variant="ghost" className="gap-2 font-bold">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Button>
                </Link>
            </header>

            <main className="container max-w-2xl relative">
                <div className="space-y-8">
                    {/* Hero Section */}
                    <div className="space-y-4 text-center">
                        <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-2">
                            <Wrench className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                            Seja um Profissional <br />
                            <span className="text-primary italic">Vai Já Serviços</span>
                        </h1>
                        <p className="text-muted-foreground font-medium max-w-md mx-auto">
                            Aumente sua clientela e receba solicitações de serviços direto no seu celular.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-3 gap-4 pb-4">
                        {[
                            { icon: Zap, text: "Pedidos em Tempo Real" },
                            { icon: Droplets, text: "Pagamento Facilitado" },
                            { icon: Sparkles, text: "Sua Agenda, Suas Regras" }
                        ].map((item, i) => (
                            <div key={i} className="bg-card p-4 rounded-2xl text-center space-y-2 border border-border/50">
                                <item.icon className="w-6 h-6 mx-auto text-primary" />
                                <p className="text-[10px] font-black uppercase tracking-tight leading-tight">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="bg-card p-6 md:p-8 rounded-[2rem] shadow-soft border border-border/50 space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="font-bold flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" /> Nome Completo
                                </Label>
                                <Input 
                                    id="name"
                                    placeholder="Como quer ser chamado?"
                                    className="h-12 rounded-xl"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone" className="font-bold flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-primary" /> WhatsApp
                                    </Label>
                                    <Input 
                                        id="phone"
                                        placeholder="(00) 00000-0000"
                                        className="h-12 rounded-xl"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-bold flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-primary" /> Sua Especialidade
                                    </Label>
                                    <Select 
                                        value={formData.category}
                                        onValueChange={(v) => setFormData({...formData, category: v})}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email" className="font-bold">E-mail (Opcional)</Label>
                                <Input 
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="h-12 rounded-xl"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="desc" className="font-bold flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" /> Conte um pouco sobre seu trabalho
                                </Label>
                                <Textarea 
                                    id="desc"
                                    placeholder="Ex: Sou eletricista predial com 10 anos de experiência..."
                                    className="min-h-[120px] rounded-2xl resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black h-16 rounded-2xl text-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                            disabled={loading}
                        >
                            {loading ? "BRASCANDO DADOS..." : "CADASTRAR E COMEÇAR"}
                        </Button>

                        <p className="text-center text-xs text-muted-foreground font-medium">
                            Ao se cadastrar, você concorda com nossos <Link to="/termos-de-uso" className="underline">Termos de Uso</Link>.
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ProviderAuth;
