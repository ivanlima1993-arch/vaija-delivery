import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Building, Search, MapPin, Bed, Bath, Car, Filter, MessageCircle, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const RealEstate = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Lead Dialog State
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
    const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [leadInfo, setLeadInfo] = useState({
        name: "",
        phone: "",
        message: ""
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("real_estate_properties")
                .select(`
                    *,
                    real_estate_images (url, is_featured)
                `)
                .eq("status", "available")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setProperties(data || []);
        } catch (error) {
            console.error("Error fetching properties:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInterestClick = (property: any) => {
        setSelectedProperty(property);
        setLeadInfo({
            name: user?.user_metadata?.full_name || "",
            phone: user?.phone || "",
            message: `Olá! Tenho interesse no imóvel: ${property.title}. Poderia me passar mais informações?`
        });
        setIsLeadDialogOpen(true);
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
                    property_id: selectedProperty.id,
                    customer_id: user?.id,
                    realtor_id: selectedProperty.owner_id,
                    customer_name: leadInfo.name,
                    customer_phone: leadInfo.phone,
                    message: leadInfo.message,
                    status: "new"
                }]);

            if (error) throw error;

            toast.success("Interesse enviado com sucesso! O corretor entrará em contato.");
            
            // Redirecionar para WhatsApp (Simulação de passo 3)
            const whatsappMessage = encodeURIComponent(leadInfo.message);
            const whatsappUrl = `https://wa.me/55${selectedProperty.owner_phone || "11999999999"}?text=${whatsappMessage}`;
            window.open(whatsappUrl, "_blank");

            setIsLeadDialogOpen(false);
        } catch (error: any) {
            toast.error("Erro ao enviar interesse: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProperties = properties.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.property_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Header />
            
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-900 text-white pt-32 pb-20 relative overflow-hidden">
                <div className="container relative z-10">
                    <div className="max-w-2xl">
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-widest">
                                <Sparkles className="w-4 h-4" />
                                Novidade: Vai Já Imóveis
                            </div>
                            <Button 
                                variant="ghost" 
                                className="text-white hover:bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10"
                                onClick={() => navigate("/profissional/imoveis")}
                            >
                                <Building className="w-4 h-4 mr-2" />
                                Portal do Corretor
                            </Button>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                            Encontre o imóvel perfeito para você
                        </h1>
                        <p className="text-emerald-100 text-lg mb-8">
                            Compre, venda ou alugue com os melhores corretores parceiros da plataforma.
                        </p>
                        
                        {/* Search Bar */}
                        <div className="bg-white p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl">
                            <div className="relative flex-1 flex items-center text-gray-800">
                                <Search className="absolute left-4 text-gray-400 w-5 h-5" />
                                <Input 
                                    placeholder="Buscar por cidade, bairro ou tipo..." 
                                    className="pl-12 border-0 bg-transparent h-12 focus-visible:ring-0 shadow-none text-base"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button className="h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 font-bold text-white w-full md:w-auto">
                                Buscar
                            </Button>
                        </div>
                    </div>
                </div>
                
                {/* Background elements */}
                <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none hidden md:block">
                    <Building className="w-full h-full" />
                </div>
            </div>

            {/* Main Content */}
            <main className="container py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 italic uppercase tracking-tight flex items-center gap-2">
                        <Building className="w-6 h-6 text-emerald-600" />
                        Imóveis em Destaque
                    </h2>
                    <Button variant="outline" className="gap-2 rounded-xl">
                        <Filter className="w-4 h-4" />
                        Filtros Avançados
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="bg-emerald-50 p-6 rounded-full mb-6">
                            <Building className="w-16 h-16 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Nenhum imóvel encontrado</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Tente ajustar sua busca ou volte em breve para ver as novidades.
                        </p>
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 px-8 font-bold text-white"
                            onClick={() => navigate("/profissional/imoveis")}
                        >
                            Sou Corretor: Quero Anunciar
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProperties.map((property) => (
                            <Card key={property.id} className="rounded-[2rem] overflow-hidden border-none shadow-soft hover:shadow-xl transition-shadow group">
                                <div className="h-64 relative overflow-hidden">
                                    <img 
                                        src={property.real_estate_images?.find((img: any) => img.is_featured)?.url || property.real_estate_images?.[0]?.url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop"} 
                                        alt={property.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <Badge className={`${property.transaction_type === 'sale' ? 'bg-blue-600' : 'bg-emerald-600'} rounded-full px-4 py-1 font-bold shadow-lg`}>
                                            {property.transaction_type === 'sale' ? 'VENDA' : 'ALUGUEL'}
                                        </Badge>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <Badge variant="outline" className="bg-white/80 backdrop-blur-md text-gray-800 border-none rounded-full px-4 py-1 font-black shadow-lg">
                                            R$ {Number(property.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-6">
                                    <div className="mb-4">
                                        <p className="text-xs text-emerald-600 font-black uppercase tracking-widest mb-1">{property.property_type}</p>
                                        <h3 className="font-bold text-xl leading-tight text-gray-800">{property.title}</h3>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                                        <MapPin className="w-4 h-4 text-emerald-600" />
                                        {property.city}, {property.state}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                        <div className="flex gap-4 text-gray-600">
                                            <div className="flex flex-col items-center">
                                                <Bed className="w-4 h-4 mb-1" />
                                                <span className="text-[10px] font-bold">{property.bedrooms} Qts</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <Bath className="w-4 h-4 mb-1" />
                                                <span className="text-[10px] font-bold">{property.bathrooms} Banh</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <Car className="w-4 h-4 mb-1" />
                                                <span className="text-[10px] font-bold">{property.parking_spots} Vagas</span>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => handleInterestClick(property)}
                                            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold group"
                                        >
                                            TENHO INTERESSE
                                            <MessageCircle className="w-4 h-4 ml-2 fill-current group-hover:rotate-12 transition-transform" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Interest Dialog */}
            <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-md">
                    <div className="bg-emerald-700 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <MessageCircle className="w-20 h-20" />
                        </div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter mb-2">Tenho Interesse</DialogTitle>
                        <DialogDescription className="text-emerald-100 font-medium">
                            Preencha seus dados para que o corretor entre em contato com você sobre o imóvel.
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
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">Seu Telefone (WhatsApp)</Label>
                            <Input 
                                placeholder="(00) 00000-0000"
                                value={leadInfo.phone}
                                onChange={(e) => setLeadInfo({...leadInfo, phone: e.target.value})}
                                className="rounded-2xl border-gray-100 h-12 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">Mensagem (Opcional)</Label>
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
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 group"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENVIAR E CHAMAR NO WHATSAPP"}
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsLeadDialogOpen(false)}
                            className="w-full text-gray-500 font-bold"
                        >
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
};

export default RealEstate;
