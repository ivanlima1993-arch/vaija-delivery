import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building, ShieldCheck, FileText, Phone, User, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const RealtorAuth = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [realtorStatus, setRealtorStatus] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        full_name: "",
        creci: "",
        phone: "",
        city: "",
        state: "SP"
    });

    useEffect(() => {
        if (user) {
            checkRealtorStatus();
        } else {
            setLoading(false);
        }
    }, [user]);

    const checkRealtorStatus = async () => {
        try {
            const { data, error } = await supabase
                .from("real_estate_realtors")
                .select("status, full_name, creci, phone, city, state")
                .eq("user_id", user?.id)
                .maybeSingle();

            if (data) {
                setRealtorStatus(data.status);
                setFormData({
                    full_name: data.full_name,
                    creci: data.creci,
                    phone: data.phone,
                    city: data.city || "",
                    state: data.state || "SP"
                });
                
                if (data.status === 'approved') {
                    navigate("/profissional/imoveis");
                }
            }
        } catch (error) {
            console.error("Error checking status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Você precisa estar logado para se cadastrar como corretor.");
            navigate("/auth");
            return;
        }

        if (!formData.full_name || !formData.creci || !formData.phone) {
            toast.error("Preencha todos os campos obrigatórios.");
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("real_estate_realtors")
                .insert([{
                    user_id: user.id,
                    full_name: formData.full_name,
                    creci: formData.creci,
                    phone: formData.phone,
                    city: formData.city,
                    state: formData.state,
                    status: 'pending'
                }]);

            if (error) throw error;

            toast.success("Cadastro enviado! Aguarde a aprovação do administrador.");
            setRealtorStatus('pending');
        } catch (error: any) {
            toast.error("Erro ao enviar cadastro: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (realtorStatus === 'pending') {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
                <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
                    <div className="bg-amber-500 p-8 text-white text-center relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck className="w-24 h-24" />
                        </div>
                        <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                            <Loader2 className="w-10 h-10 animate-spin" />
                        </div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Em Análise</h2>
                        <p className="text-amber-50 font-medium">Seus dados foram enviados com sucesso.</p>
                    </div>
                    <CardContent className="p-8 text-center space-y-6">
                        <p className="text-gray-600 leading-relaxed">
                            Olá <span className="font-bold text-gray-800">{formData.full_name}</span>, nossa equipe está revisando seu cadastro e o registro do **CRECI: {formData.creci}**.
                        </p>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-sm text-amber-800 font-medium">
                            O prazo de aprovação é de até 24 horas úteis. Você receberá um aviso assim que for liberado.
                        </div>
                        <Button 
                            variant="outline" 
                            className="w-full rounded-2xl h-12 font-bold"
                            onClick={() => navigate("/")}
                        >
                            Voltar para o Início
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md mb-6">
                <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-gray-500 hover:text-emerald-700">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </Button>
            </div>

            <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
                <div className="bg-emerald-700 p-8 text-white text-center relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Building className="w-24 h-24" />
                    </div>
                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Portal do Corretor</h2>
                    <p className="text-emerald-50 font-medium">Cadastre-se para anunciar seus imóveis.</p>
                </div>

                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                                <Input 
                                    placeholder="Como no seu RG/CRECI"
                                    className="pl-12 rounded-2xl border-gray-100 h-12 focus:ring-emerald-500"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">Registro CRECI</Label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                                <Input 
                                    placeholder="Ex: 123456-F"
                                    className="pl-12 rounded-2xl border-gray-100 h-12 focus:ring-emerald-500"
                                    value={formData.creci}
                                    onChange={(e) => setFormData({...formData, creci: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">WhatsApp de Contato</Label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                                <Input 
                                    placeholder="(00) 00000-0000"
                                    className="pl-12 rounded-2xl border-gray-100 h-12 focus:ring-emerald-500"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">Cidade</Label>
                                <Input 
                                    placeholder="Sua cidade"
                                    className="rounded-2xl border-gray-100 h-12 focus:ring-emerald-500"
                                    value={formData.city}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">Estado</Label>
                                <Input 
                                    placeholder="UF"
                                    maxLength={2}
                                    className="rounded-2xl border-gray-100 h-12 focus:ring-emerald-500"
                                    value={formData.state}
                                    onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 mt-6"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENVIAR PARA APROVAÇÃO"}
                        </Button>
                    </form>

                    <div className="mt-8 flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl text-emerald-800 text-xs font-medium">
                        <CheckCircle2 className="w-8 h-8 shrink-0 opacity-50" />
                        <p>Ao se cadastrar, você concorda em seguir as normas do conselho de corretores e os termos de uso da plataforma.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default RealtorAuth;
