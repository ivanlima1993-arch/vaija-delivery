import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
    Building, Search, MapPin, Bed, Bath, Car, 
    Filter, MessageCircle, X, Loader2, Sparkles, 
    ArrowRight, ChevronDown, SlidersHorizontal
} from "lucide-react";
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
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const RealEstate = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        transaction_type: "all",
        property_type: "all",
        min_price: "",
        max_price: "",
        bedrooms: "all"
    });
    const [showFilters, setShowFilters] = useState(false);
    
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
            message: `Olá! Tenho interesse no imóvel "${property.title}". Poderia me passar mais informações?`
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

            toast.success("Interesse enviado com sucesso!");
            
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

    const filteredProperties = properties.filter(p => {
        const matchesSearch = 
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.city.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesTransaction = filters.transaction_type === "all" || p.transaction_type === filters.transaction_type;
        const matchesType = filters.property_type === "all" || p.property_type === filters.property_type;
        const matchesMinPrice = !filters.min_price || p.price >= parseFloat(filters.min_price);
        const matchesMaxPrice = !filters.max_price || p.price <= parseFloat(filters.max_price);
        const matchesBedrooms = filters.bedrooms === "all" || p.bedrooms >= parseInt(filters.bedrooms);

        return matchesSearch && matchesTransaction && matchesType && matchesMinPrice && matchesMaxPrice && matchesBedrooms;
    });

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Header />
            
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-900 text-white pt-32 pb-24 relative overflow-hidden">
                <div className="container relative z-10">
                    <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-4 mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-widest">
                                <Sparkles className="w-4 h-4" />
                                Premium Real Estate
                            </div>
                            <Button 
                                variant="ghost" 
                                className="text-white hover:bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10"
                                onClick={() => navigate("/corretor/auth")}
                            >
                                <Building className="w-4 h-4 mr-2" />
                                Portal do Corretor
                            </Button>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight italic uppercase tracking-tighter">
                            Onde seus sonhos <br /> ganham um endereço.
                        </h1>
                        <p className="text-emerald-100 text-lg mb-10 max-w-xl font-medium">
                            Encontre casas, apartamentos e terrenos com a segurança que só a Vai Já oferece.
                        </p>
                        
                        {/* Compact Search Bar */}
                        <div className="bg-white p-3 rounded-[2.5rem] flex flex-col md:flex-row gap-3 shadow-2xl max-w-2xl">
                            <div className="relative flex-1 flex items-center text-gray-800">
                                <Search className="absolute left-5 text-emerald-600 w-5 h-5" />
                                <Input 
                                    placeholder="Onde você quer morar?" 
                                    className="pl-14 border-0 bg-transparent h-14 focus-visible:ring-0 shadow-none text-lg font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button 
                                onClick={() => setShowFilters(!showFilters)}
                                variant="outline" 
                                className="h-14 rounded-3xl px-6 gap-2 border-emerald-100 text-emerald-700 font-bold"
                            >
                                <SlidersHorizontal className="w-4 h-4" /> FILTROS
                            </Button>
                            <Button className="h-14 bg-emerald-600 hover:bg-emerald-700 rounded-3xl px-10 font-black text-white shadow-lg shadow-emerald-900/20">
                                BUSCAR
                            </Button>
                        </div>

                        {/* Expandable Filters */}
                        {showFilters && (
                            <Card className="mt-4 rounded-[2rem] border-none shadow-2xl p-8 bg-white text-gray-800 animate-in fade-in slide-in-from-top-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tipo de Negócio</Label>
                                        <Select value={filters.transaction_type} onValueChange={(v) => setFilters({...filters, transaction_type: v})}>
                                            <SelectTrigger className="rounded-xl border-gray-100 h-12 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="sale">Venda</SelectItem>
                                                <SelectItem value="rent">Aluguel</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tipo de Imóvel</Label>
                                        <Select value={filters.property_type} onValueChange={(v) => setFilters({...filters, property_type: v})}>
                                            <SelectTrigger className="rounded-xl border-gray-100 h-12 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="Apartamento">Apartamento</SelectItem>
                                                <SelectItem value="Casa">Casa</SelectItem>
                                                <SelectItem value="Terreno">Terreno</SelectItem>
                                                <SelectItem value="Comercial">Comercial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mínimo de Quartos</Label>
                                        <Select value={filters.bedrooms} onValueChange={(v) => setFilters({...filters, bedrooms: v})}>
                                            <SelectTrigger className="rounded-xl border-gray-100 h-12 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Qualquer</SelectItem>
                                                <SelectItem value="1">1+ Quartos</SelectItem>
                                                <SelectItem value="2">2+ Quartos</SelectItem>
                                                <SelectItem value="3">3+ Quartos</SelectItem>
                                                <SelectItem value="4">4+ Quartos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preço Máximo</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="Até R$"
                                            className="rounded-xl border-gray-100 h-12 font-bold"
                                            value={filters.max_price}
                                            onChange={(e) => setFilters({...filters, max_price: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-6">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setFilters({transaction_type: "all", property_type: "all", min_price: "", max_price: "", bedrooms: "all"})}
                                        className="text-xs font-bold text-gray-400"
                                    >
                                        LIMPAR FILTROS
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
                
                {/* Background Shapes */}
                <div className="absolute right-[-10%] top-[-10%] w-[50%] h-[120%] opacity-10 pointer-events-none hidden md:block">
                    <Building className="w-full h-full" />
                </div>
            </div>

            {/* Main Content */}
            <main className="container py-16">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-gray-800 italic uppercase tracking-tighter flex items-center gap-3">
                            <Building className="w-8 h-8 text-emerald-600" />
                            Imóveis em Destaque
                        </h2>
                        <p className="text-gray-400 font-medium mt-2">Encontramos {filteredProperties.length} imóveis para você.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[3rem] border border-gray-100 shadow-soft">
                        <div className="bg-emerald-50 p-8 rounded-full mb-8">
                            <Building className="w-20 h-20 text-emerald-600 opacity-20" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-800 mb-3 uppercase italic">Nenhum imóvel encontrado</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-10 font-medium">
                            Não encontramos imóveis com esses filtros. Tente ajustar sua busca ou cadastrar um novo imóvel.
                        </p>
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl h-14 px-10 font-black text-white shadow-xl shadow-emerald-100"
                            onClick={() => navigate("/corretor/auth")}
                        >
                            SOU CORRETOR: QUERO ANUNCIAR
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredProperties.map((property) => (
                            <Card 
                                key={property.id} 
                                className="rounded-[2.5rem] overflow-hidden border-none shadow-soft hover:shadow-2xl transition-all group cursor-pointer bg-white"
                                onClick={() => navigate(`/imoveis/${property.id}`)}
                            >
                                <div className="h-72 relative overflow-hidden">
                                    <img 
                                        src={property.real_estate_images?.find((img: any) => img.is_featured)?.url || property.real_estate_images?.[0]?.url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop"} 
                                        alt={property.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-6 right-6 flex gap-2">
                                        <Badge className={`${property.transaction_type === 'sale' ? 'bg-blue-600' : 'bg-emerald-600'} rounded-full px-5 py-1.5 font-black text-[10px] shadow-xl uppercase`}>
                                            {property.transaction_type === 'sale' ? 'VENDA' : 'ALUGUEL'}
                                        </Badge>
                                    </div>
                                    <div className="absolute bottom-6 left-6">
                                        <Badge className="bg-white/90 backdrop-blur-md text-gray-900 border-none rounded-full px-5 py-2 font-black text-lg shadow-2xl">
                                            R$ {Number(property.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-8">
                                    <div className="mb-5">
                                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mb-2">{property.property_type}</p>
                                        <h3 className="font-black text-2xl leading-tight text-gray-800 italic uppercase tracking-tighter group-hover:text-emerald-600 transition-colors line-clamp-1">
                                            {property.title}
                                        </h3>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm text-gray-400 font-bold mb-6">
                                        <MapPin className="w-4 h-4 text-emerald-600" />
                                        {property.city}, {property.state}
                                    </div>

                                    <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                                        <div className="flex gap-6 text-gray-400">
                                            <div className="flex flex-col items-center group/icon">
                                                <Bed className="w-5 h-5 mb-1 group-hover/icon:text-emerald-600 transition-colors" />
                                                <span className="text-[10px] font-black">{property.bedrooms} QTS</span>
                                            </div>
                                            <div className="flex flex-col items-center group/icon">
                                                <Bath className="w-5 h-5 mb-1 group-hover/icon:text-emerald-600 transition-colors" />
                                                <span className="text-[10px] font-black">{property.bathrooms} BANH</span>
                                            </div>
                                            <div className="flex flex-col items-center group/icon">
                                                <Car className="w-5 h-5 mb-1 group-hover/icon:text-emerald-600 transition-colors" />
                                                <span className="text-[10px] font-black">{property.parking_spots} VAGAS</span>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleInterestClick(property);
                                            }}
                                            className="bg-gray-900 hover:bg-emerald-700 rounded-[1.2rem] h-12 px-6 font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
                                        >
                                            TENHO INTERESSE
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
                            O corretor responsável entrará em contato com você o mais breve possível.
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
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-1">WhatsApp</Label>
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
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENVIAR INTERESSE AGORA"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
};

export default RealEstate;
