import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    Building, MapPin, Bed, Bath, Car, MessageCircle, 
    ArrowLeft, Share2, Heart, ChevronLeft, ChevronRight,
    CheckCircle2, Loader2, Calendar, Maximize2, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Lead Dialog State
    const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [leadInfo, setLeadInfo] = useState({
        name: "",
        phone: "",
        message: ""
    });

    useEffect(() => {
        fetchPropertyDetails();
    }, [id]);

    const fetchPropertyDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("real_estate_properties")
                .select(`
                    *,
                    real_estate_images (url, is_featured),
                    realtor:real_estate_realtors (full_name, creci, phone, status)
                `)
                .eq("id", id)
                .single();

            if (error) throw error;
            setProperty(data);
            
            setLeadInfo({
                name: user?.user_metadata?.full_name || "",
                phone: user?.phone || "",
                message: `Olá! Tenho interesse no imóvel "${data.title}" (${data.property_type}). Poderia me passar mais informações?`
            });
        } catch (error: any) {
            toast.error("Erro ao carregar detalhes: " + error.message);
            navigate("/imoveis");
        } finally {
            setLoading(false);
        }
    };

    const handleSendLead = async () => {
        if (!leadInfo.name || !leadInfo.phone) {
            toast.error("Por favor, preencha seu nome e telefone.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("real_estate_leads")
                .insert([{
                    property_id: property.id,
                    customer_id: user?.id,
                    realtor_id: property.owner_id,
                    customer_name: leadInfo.name,
                    customer_phone: leadInfo.phone,
                    message: leadInfo.message,
                    status: "new"
                }]);

            if (error) throw error;

            toast.success("Interesse enviado com sucesso!");
            
            const whatsappMessage = encodeURIComponent(leadInfo.message);
            const whatsappUrl = `https://wa.me/55${property.realtor?.phone || property.owner_phone || "11999999999"}?text=${whatsappMessage}`;
            window.open(whatsappUrl, "_blank");

            setIsLeadDialogOpen(false);
        } catch (error: any) {
            toast.error("Erro ao enviar interesse: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            </div>
        );
    }

    const images = property.real_estate_images || [];

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Header />
            
            <main className="container pt-32 pb-20">
                {/* Voltar e Ações Rápidas */}
                <div className="flex justify-between items-center mb-6">
                    <Button variant="ghost" onClick={() => navigate("/imoveis")} className="gap-2 rounded-xl text-gray-500 hover:text-emerald-700">
                        <ArrowLeft className="w-4 h-4" /> Voltar para a lista
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="rounded-full">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full">
                            <Heart className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna da Esquerda: Fotos e Detalhes */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Galeria de Fotos */}
                        <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-video group shadow-2xl">
                            {images.length > 0 ? (
                                <>
                                    <img 
                                        src={images[currentImageIndex].url} 
                                        alt={property.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {images.length > 1 && (
                                        <>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </Button>
                                        </>
                                    )}
                                    <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold">
                                        {currentImageIndex + 1} / {images.length}
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-gray-900">
                                    <Building className="w-20 h-20 mb-4 opacity-20" />
                                    <p>Sem fotos disponíveis</p>
                                </div>
                            )}
                        </div>

                        {/* Título e Preço */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-100">
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                <div>
                                    <div className="flex gap-2 mb-3">
                                        <Badge className={`${property.transaction_type === 'sale' ? 'bg-blue-600' : 'bg-emerald-600'} rounded-full px-4 py-1 font-bold`}>
                                            {property.transaction_type === 'sale' ? 'VENDA' : 'ALUGUEL'}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-full px-4 py-1 font-bold text-gray-500 border-gray-200 uppercase tracking-widest text-[10px]">
                                            {property.property_type}
                                        </Badge>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black text-gray-800 leading-tight mb-2 italic uppercase tracking-tighter">
                                        {property.title}
                                    </h1>
                                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                                        <MapPin className="w-5 h-5 text-emerald-600" />
                                        {property.address}, {property.city} - {property.state}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Valor do Imóvel</p>
                                    <h2 className="text-4xl font-black text-gray-900">
                                        R$ {Number(property.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </h2>
                                    {property.transaction_type === 'rent' && <span className="text-sm font-bold text-gray-400">/ mensal</span>}
                                </div>
                            </div>

                            {/* Características */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-50 p-3 rounded-2xl">
                                        <Bed className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-800">{property.bedrooms}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Quartos</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-50 p-3 rounded-2xl">
                                        <Bath className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-800">{property.bathrooms}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Banheiros</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-50 p-3 rounded-2xl">
                                        <Car className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-800">{property.parking_spots}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Vagas</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-50 p-3 rounded-2xl">
                                        <Maximize2 className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-800">120m²</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Área Total</p>
                                    </div>
                                </div>
                            </div>

                            {/* Descrição */}
                            <div className="mt-8">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 italic uppercase">Descrição do Imóvel</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                                    {property.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Coluna da Direita: Corretor e Ação */}
                    <div className="space-y-6">
                        {/* Card do Corretor */}
                        <Card className="rounded-[2.5rem] border-none shadow-soft overflow-hidden">
                            <CardContent className="p-0">
                                <div className="bg-gray-900 p-8 text-white">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">Anunciante Responsável</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center text-2xl font-black italic">
                                            {property.realtor?.full_name?.[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black italic uppercase tracking-tighter leading-tight">
                                                {property.realtor?.full_name || "Corretor Parceiro"}
                                            </h4>
                                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                                <CheckCircle2 className="w-3 h-3" />
                                                CRECI {property.realtor?.creci}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-white space-y-4">
                                    <Button 
                                        onClick={() => setIsLeadDialogOpen(true)}
                                        className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 group"
                                    >
                                        TENHO INTERESSE
                                        <MessageCircle className="w-6 h-6 ml-2 fill-current group-hover:rotate-12 transition-transform" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full h-14 rounded-2xl font-bold gap-2"
                                        onClick={() => window.open(`tel:${property.realtor?.phone || property.owner_phone}`, "_self")}
                                    >
                                        <Calendar className="w-5 h-5 text-emerald-600" />
                                        AGENDAR VISITA
                                    </Button>
                                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                                        Resposta média em até 15 minutos
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Segurança */}
                        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                            <div className="flex gap-4">
                                <ShieldCheck className="w-10 h-10 text-blue-600 shrink-0" />
                                <div>
                                    <h5 className="font-bold text-blue-900 italic uppercase text-sm mb-1">Negócio Seguro</h5>
                                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                        Este imóvel foi verificado e o corretor possui registro CRECI ativo na plataforma Vai Já.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Lead Dialog */}
            <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-md">
                    <div className="bg-emerald-700 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <MessageCircle className="w-20 h-20" />
                        </div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter mb-2">Quero este Imóvel</DialogTitle>
                        <DialogDescription className="text-emerald-100 font-medium">
                            Seus dados serão enviados diretamente para o corretor {property.realtor?.full_name}.
                        </DialogDescription>
                    </div>

                    <div className="p-8 space-y-4 bg-white">
                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">Seu Nome</Label>
                            <Input 
                                placeholder="Seu nome completo"
                                value={leadInfo.name}
                                onChange={(e) => setLeadInfo({...leadInfo, name: e.target.value})}
                                className="rounded-2xl border-gray-100 h-12 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">Seu WhatsApp</Label>
                            <Input 
                                placeholder="(00) 00000-0000"
                                value={leadInfo.phone}
                                onChange={(e) => setLeadInfo({...leadInfo, phone: e.target.value})}
                                className="rounded-2xl border-gray-100 h-12 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">Mensagem</Label>
                            <Textarea 
                                value={leadInfo.message}
                                onChange={(e) => setLeadInfo({...leadInfo, message: e.target.value})}
                                className="rounded-2xl border-gray-100 min-h-[100px] focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-gray-50 flex-col sm:flex-col gap-3">
                        <Button 
                            onClick={handleSendLead}
                            disabled={isSubmitting}
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENVIAR INTERESSE AGORA"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
};

export default PropertyDetails;
