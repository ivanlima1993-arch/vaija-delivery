import { useEffect, useState } from "react";
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
    Sparkles,
    HardHat,
    Hammer,
    Paintbrush,
    Zap,
    Loader2,
    Lock,
    Mail,
    Droplets,
    Sparkles,
    Camera,
    Upload,
    X
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
    const [authMode, setAuthMode] = useState<"login" | "register">("login");
    const [loginCpf, setLoginCpf] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        category: "",
        description: "",
        email: "",
        password: "",
        cpf: "",
        birth_date: "",
        address: "",
        city_id: "",
        image_url: "",
    });

    const [cities, setCities] = useState<any[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchCities = async () => {
            const { data } = await supabase.from("cities").select("*").eq("is_active", true);
            if (data) setCities(data);
        };
        fetchCities();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.phone || !formData.category || !formData.cpf || !formData.birth_date || !formData.address || !formData.city_id || !formData.email || !formData.password || (!imageFile && !formData.image_url)) {
            toast.error("Preencha todos os campos obrigatórios, incluindo e-mail, senha e foto de perfil");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Add Provider Role
                await supabase.from("user_roles").insert({
                    user_id: authData.user.id,
                    role: "provider",
                });

                // 3. Upload Image
                let finalImageUrl = formData.image_url;
                if (imageFile) {
                    setUploading(true);
                    const fileExt = imageFile.name.split('.').pop();
                    const fileName = `provider-leads/${authData.user.id}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, imageFile, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);
                    
                    finalImageUrl = publicUrl;
                    setUploading(false);
                }

                // 4. Create Service Provider Record
                const { error: insertError } = await supabase
                    .from("service_providers" as any)
                    .insert([{
                        id: crypto.randomUUID(),
                        user_id: authData.user.id,
                        name: formData.name,
                        full_name: formData.name,
                        phone: formData.phone,
                        category: formData.category,
                        description: formData.description,
                        email: formData.email,
                        cpf: formData.cpf,
                        birth_date: formData.birth_date,
                        address: formData.address,
                        city_id: formData.city_id,
                        image_url: finalImageUrl,
                        is_active: false // Começa como inativo para aprovação do admin
                    }]);

                if (insertError) throw insertError;
                
                setSubmitted(true);
                toast.success("Cadastro enviado com sucesso! Aguarde a aprovação.");
            }
        } catch (error: any) {
            console.error("Erro no cadastro:", error);
            toast.error("Erro ao enviar cadastro: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Find email by CPF
            const { data: provider, error: fetchError } = await supabase
                .from("service_providers")
                .select("email, is_active")
                .eq("cpf", loginCpf)
                .maybeSingle();

            if (fetchError) throw fetchError;
            if (!provider) {
                toast.error("CPF não encontrado nos nossos registros de profissionais.");
                setLoading(false);
                return;
            }

            // 2. Login with Email + Password
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: provider.email,
                password: loginPassword,
            });

            if (loginError) throw loginError;

            toast.success("Login realizado com sucesso!");
            navigate("/profissional");
        } catch (error: any) {
            console.error("Erro no login:", error);
            toast.error("Erro ao entrar: " + (error.message || "Senha incorreta"));
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
                            {authMode === "login" ? "Login do Profissional" : "Seja um Profissional"} <br />
                            <span className="text-primary italic">Vai Já Serviços</span>
                        </h1>
                        <p className="text-muted-foreground font-medium max-w-md mx-auto">
                            {authMode === "login" 
                                ? "Acesse sua conta para gerenciar seus serviços e ganhos." 
                                : "Aumente sua clientela e receba solicitações de serviços direto no seu celular."}
                        </p>
                    </div>

                    {/* Auth Mode Toggle */}
                    <div className="flex bg-card p-1 rounded-2xl border border-border/50 max-w-sm mx-auto">
                        <button
                            onClick={() => setAuthMode("login")}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${authMode === "login" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            LOGIN
                        </button>
                        <button
                            onClick={() => setAuthMode("register")}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${authMode === "register" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            CADASTRO
                        </button>
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

                    <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="bg-card p-6 md:p-8 rounded-[2rem] shadow-soft border border-border/50 space-y-6">
                        {authMode === "login" ? (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="login_cpf" className="font-bold flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" /> Seu CPF
                                    </Label>
                                    <Input 
                                        id="login_cpf"
                                        placeholder="000.000.000-00"
                                        className="h-12 rounded-xl"
                                        value={loginCpf}
                                        onChange={(e) => setLoginCpf(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="login_pass" className="font-bold flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-primary" /> Sua Senha
                                    </Label>
                                    <Input 
                                        id="login_pass"
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-12 rounded-xl"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid gap-4">
                                    <Label className="font-bold flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-primary" /> Foto do Perfil
                                    </Label>
                                    
                                    <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-border rounded-[2rem] bg-muted/30 transition-all hover:bg-muted/50 hover:border-primary/50 relative overflow-hidden group">
                                        {imagePreview ? (
                                            <div className="relative w-32 h-32 md:w-40 md:h-40">
                                                <img 
                                                    src={imagePreview} 
                                                    alt="Preview" 
                                                    className="w-full h-full object-cover rounded-full border-4 border-background shadow-xl"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div 
                                                className="text-center cursor-pointer py-4"
                                                onClick={() => document.getElementById('photo-upload')?.click()}
                                            >
                                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                    <Upload className="w-10 h-10 text-primary" />
                                                </div>
                                                <p className="text-sm font-bold text-foreground">Clique para enviar sua foto</p>
                                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG de até 5MB</p>
                                            </div>
                                        )}
                                        
                                        <input 
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                            required={!imageFile}
                                        />

                                        {uploading && (
                                            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                    <p className="text-xs font-black uppercase">Enviando foto...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="font-bold flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" /> Nome Completo
                                    </Label>
                                    <Input 
                                        id="name"
                                        placeholder="Ex: João Silva"
                                        className="h-12 rounded-xl"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="cpf" className="font-bold">CPF</Label>
                                        <Input 
                                            id="cpf"
                                            placeholder="000.000.000-00"
                                            className="h-12 rounded-xl"
                                            value={formData.cpf}
                                            onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="birth_date" className="font-bold">Data de Nascimento</Label>
                                        <Input 
                                            id="birth_date"
                                            type="date"
                                            className="h-12 rounded-xl"
                                            value={formData.birth_date}
                                            onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone" className="font-bold flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-primary" /> WhatsApp
                                        </Label>
                                        <Input 
                                            id="phone"
                                            placeholder="(79) 99999-9999"
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="city" className="font-bold">Cidade onde vai atuar</Label>
                                        <Select 
                                            value={formData.city_id}
                                            onValueChange={(v) => setFormData({...formData, city_id: v})}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue placeholder="Selecione a cidade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cities.map(city => (
                                                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="address" className="font-bold">Endereço Completo</Label>
                                        <Input 
                                            id="address"
                                            placeholder="Rua, Número, Bairro"
                                            className="h-12 rounded-xl"
                                            value={formData.address}
                                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="font-bold flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-primary" /> E-mail (Acesso)
                                        </Label>
                                        <Input 
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            className="h-12 rounded-xl"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="pass" className="font-bold flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-primary" /> Senha (Mín. 6 caracteres)
                                        </Label>
                                        <Input 
                                            id="pass"
                                            type="password"
                                            placeholder="••••••••"
                                            className="h-12 rounded-xl"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            required
                                            minLength={6}
                                        />
                                    </div>
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
                        )}

                        <Button 
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black h-16 rounded-2xl text-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                            disabled={loading || uploading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>{authMode === "login" ? "ENTRANDO..." : "ENVIANDO..."}</span>
                                </div>
                            ) : (authMode === "login" ? "ENTRAR" : "CADASTRAR E COMEÇAR")}
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
