import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Building, Plus, MapPin, DollarSign, Bed, Bath, Car, 
    ArrowLeft, Loader2, Image as ImageIcon, X, LogOut, 
    MessageSquare, User, Calendar, Trash2, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const RealEstateProperties = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"properties" | "leads">("properties");
    const [properties, setProperties] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const [newProperty, setNewProperty] = useState({
        title: "",
        description: "",
        transaction_type: "sale" as "sale" | "rent",
        property_type: "Apartamento",
        price: "",
        bedrooms: "0",
        bathrooms: "0",
        parking_spots: "0",
        address: "",
        city: "",
        state: "SP"
    });

    useEffect(() => {
        if (!user) return;
        
        const checkApproval = async () => {
            const { data, error } = await supabase
                .from("real_estate_realtors")
                .select("status")
                .eq("user_id", user.id)
                .maybeSingle();
            
            if (error || !data || data.status !== 'approved') {
                navigate("/corretor/auth");
                return;
            }
            
            fetchData();
        };

        checkApproval();
    }, [user, navigate]);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchProperties(), fetchLeads()]);
        setLoading(false);
    };

    const fetchProperties = async () => {
        try {
            const { data, error } = await supabase
                .from("real_estate_properties")
                .select(`
                    *,
                    real_estate_images (url)
                `)
                .eq("owner_id", user?.id)
                .order("created_at", { ascending: false });
                
            if (error) throw error;
            setProperties(data || []);
        } catch (error) {
            console.error("Error fetching properties:", error);
        }
    };

    const fetchLeads = async () => {
        try {
            const { data, error } = await supabase
                .from("real_estate_leads")
                .select(`
                    *,
                    property:real_estate_properties (title, property_type)
                `)
                .eq("realtor_id", user?.id)
                .order("created_at", { ascending: false });
            
            if (error) throw error;
            setLeads(data || []);
        } catch (error) {
            console.error("Error fetching leads:", error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedImages(prev => [...prev, ...filesArray]);
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddProperty = async () => {
        if (!newProperty.title || !newProperty.price || !newProperty.city) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: propertyData, error: propertyError } = await supabase
                .from("real_estate_properties")
                .insert([{
                    owner_id: user?.id,
                    title: newProperty.title,
                    description: newProperty.description,
                    transaction_type: newProperty.transaction_type,
                    property_type: newProperty.property_type,
                    price: parseFloat(newProperty.price),
                    bedrooms: parseInt(newProperty.bedrooms),
                    bathrooms: parseInt(newProperty.bathrooms),
                    parking_spots: parseInt(newProperty.parking_spots),
                    address: newProperty.address,
                    city: newProperty.city,
                    state: newProperty.state,
                    status: "available"
                }])
                .select()
                .single();

            if (propertyError) throw propertyError;

            if (selectedImages.length > 0) {
                for (const file of selectedImages) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${propertyData.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('properties')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('properties')
                        .getPublicUrl(filePath);

                    await supabase
                        .from('real_estate_images')
                        .insert([{
                            property_id: propertyData.id,
                            url: publicUrl,
                            is_featured: selectedImages.indexOf(file) === 0
                        }]);
                }
            }

            toast.success("Imóvel cadastrado com sucesso!");
            setIsAddDialogOpen(false);
            fetchProperties();
        } catch (error: any) {
            toast.error("Erro ao cadastrar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProperty = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este anúncio?")) return;
        
        try {
            const { error } = await supabase
                .from("real_estate_properties")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("Imóvel excluído.");
            fetchProperties();
        } catch (error: any) {
            toast.error("Erro ao excluir: " + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] pb-20">
            {/* Header */}
            <div className="bg-emerald-700 text-white p-6 shadow-md rounded-b-[2.5rem] sticky top-0 z-20">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white hover:bg-emerald-600 rounded-full"
                            onClick={() => navigate("/")}
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black italic tracking-tight uppercase">Portal do Corretor</h1>
                            <p className="text-emerald-100 text-xs font-medium">Gerencie sua imobiliária digital</p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-emerald-600 rounded-full"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate("/");
                        }}
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-black/10 rounded-2xl backdrop-blur-md">
                    <Button 
                        onClick={() => setActiveTab("properties")}
                        className={`flex-1 rounded-xl h-12 font-black transition-all ${activeTab === 'properties' ? 'bg-white text-emerald-700 shadow-lg' : 'bg-transparent text-white hover:bg-white/10'}`}
                    >
                        <Building className="w-4 h-4 mr-2" /> MEUS IMÓVEIS
                    </Button>
                    <Button 
                        onClick={() => setActiveTab("leads")}
                        className={`flex-1 rounded-xl h-12 font-black transition-all ${activeTab === 'leads' ? 'bg-white text-emerald-700 shadow-lg' : 'bg-transparent text-white hover:bg-white/10'}`}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" /> LEADS 
                        {leads.filter(l => l.status === 'new').length > 0 && (
                            <Badge className="ml-2 bg-red-500 border-none">{leads.filter(l => l.status === 'new').length}</Badge>
                        )}
                    </Button>
                </div>
            </div>

            <main className="container py-8">
                {activeTab === "properties" ? (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black italic uppercase tracking-tight text-gray-800 flex items-center gap-2">
                                <Building className="w-6 h-6 text-emerald-600" />
                                Lista de Anúncios
                            </h2>
                            <Button 
                                onClick={() => setIsAddDialogOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black gap-2 shadow-lg shadow-emerald-100"
                            >
                                <Plus className="w-5 h-5" /> NOVO IMÓVEL
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                            </div>
                        ) : properties.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100">
                                <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Building className="w-10 h-10 text-emerald-600 opacity-20" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Nenhum imóvel cadastrado</h3>
                                <p className="text-gray-400 mb-6">Comece agora a anunciar seus imóveis.</p>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(true)} className="rounded-xl font-bold">Cadastrar Primeiro Imóvel</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {properties.map((property) => (
                                    <Card key={property.id} className="rounded-[2rem] overflow-hidden border-none shadow-soft hover:shadow-xl transition-all group">
                                        <div className="h-48 relative">
                                            <img 
                                                src={property.real_estate_images?.[0]?.url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop"} 
                                                alt={property.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <Button 
                                                    variant="destructive" 
                                                    size="icon" 
                                                    className="rounded-full shadow-lg h-10 w-10"
                                                    onClick={() => handleDeleteProperty(property.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <Badge className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md text-gray-900 border-none font-black px-4 py-1">
                                                R$ {Number(property.price).toLocaleString('pt-BR')}
                                            </Badge>
                                        </div>
                                        <CardContent className="p-6">
                                            <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">{property.property_type} • {property.transaction_type === 'sale' ? 'Venda' : 'Aluguel'}</p>
                                            <h3 className="font-bold text-gray-800 mb-4 line-clamp-1">{property.title}</h3>
                                            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                                <div className="flex gap-4 text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <Bed className="w-3 h-3" /> <span className="text-[10px] font-bold">{property.bedrooms}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Bath className="w-3 h-3" /> <span className="text-[10px] font-bold">{property.bathrooms}</span>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-emerald-600 font-bold gap-1 p-0 h-auto hover:bg-transparent"
                                                    onClick={() => navigate(`/imoveis/${property.id}`)}
                                                >
                                                    VER NO SITE <ExternalLink className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black italic uppercase tracking-tight text-gray-800 flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-emerald-600" />
                                Leads e Interessados
                            </h2>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100">
                                <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-10 h-10 text-emerald-600 opacity-20" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Nenhum lead ainda</h3>
                                <p className="text-gray-400">Assim que alguém se interessar, aparecerá aqui.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {leads.map((lead) => (
                                    <Card key={lead.id} className="rounded-[2rem] border-none shadow-soft p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:shadow-xl transition-all">
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                                                <User className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-black italic uppercase text-gray-800">{lead.customer_name}</h4>
                                                    {lead.status === 'new' && <Badge className="bg-red-500 rounded-full text-[8px] px-2 py-0">NOVO</Badge>}
                                                </div>
                                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">{lead.property?.title}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                                    <Calendar className="w-3 h-3" /> {new Date(lead.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 px-4 text-sm text-gray-600 font-medium italic">
                                            "{lead.message}"
                                        </div>

                                        <div className="flex gap-2 w-full md:w-auto">
                                            <Button 
                                                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold gap-2"
                                                onClick={() => window.open(`https://wa.me/55${lead.customer_phone}`, "_blank")}
                                            >
                                                <MessageCircle className="w-4 h-4 fill-current" /> WHATSAPP
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Add Property Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-emerald-700 p-8 text-white">
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter mb-2">Novo Anúncio</DialogTitle>
                        <DialogDescription className="text-emerald-100 font-medium">Preencha as informações do imóvel para publicar na vitrine.</DialogDescription>
                    </div>
                    
                    <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
                        {/* Imagens */}
                        <div className="space-y-4">
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Fotos do Imóvel</Label>
                            <div className="grid grid-cols-4 gap-4">
                                {previews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border shadow-inner">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-[8px] font-black text-center py-1 uppercase">Capa</div>
                                        )}
                                    </div>
                                ))}
                                <label className="aspect-square rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 transition-colors group">
                                    <ImageIcon className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black text-emerald-600 mt-2">ADICIONAR</span>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Título do Anúncio</Label>
                                <Input 
                                    id="title" 
                                    placeholder="Ex: Apartamento Vista Mar"
                                    value={newProperty.title}
                                    onChange={(e) => setNewProperty({...newProperty, title: e.target.value})}
                                    className="rounded-xl border-emerald-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Tipo de Negócio</Label>
                                <Select value={newProperty.transaction_type} onValueChange={(v: any) => setNewProperty({...newProperty, transaction_type: v})}>
                                    <SelectTrigger className="rounded-xl border-emerald-100">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sale">Venda</SelectItem>
                                        <SelectItem value="rent">Aluguel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Tipo de Imóvel</Label>
                                <Select value={newProperty.property_type} onValueChange={(v) => setNewProperty({...newProperty, property_type: v})}>
                                    <SelectTrigger className="rounded-xl border-emerald-100">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Apartamento">Apartamento</SelectItem>
                                        <SelectItem value="Casa">Casa</SelectItem>
                                        <SelectItem value="Sobrado">Sobrado</SelectItem>
                                        <SelectItem value="Terreno">Terreno</SelectItem>
                                        <SelectItem value="Comercial">Comercial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Valor (R$)</Label>
                                <Input 
                                    id="price" 
                                    type="number"
                                    placeholder="0,00"
                                    value={newProperty.price}
                                    onChange={(e) => setNewProperty({...newProperty, price: e.target.value})}
                                    className="rounded-xl border-emerald-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Quartos</Label>
                                <Input type="number" value={newProperty.bedrooms} onChange={(e) => setNewProperty({...newProperty, bedrooms: e.target.value})} className="rounded-xl border-emerald-100" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Banheiros</Label>
                                <Input type="number" value={newProperty.bathrooms} onChange={(e) => setNewProperty({...newProperty, bathrooms: e.target.value})} className="rounded-xl border-emerald-100" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Vagas</Label>
                                <Input type="number" value={newProperty.parking_spots} onChange={(e) => setNewProperty({...newProperty, parking_spots: e.target.value})} className="rounded-xl border-emerald-100" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Cidade</Label>
                                <Input value={newProperty.city} onChange={(e) => setNewProperty({...newProperty, city: e.target.value})} className="rounded-xl border-emerald-100" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">UF</Label>
                                <Input maxLength={2} value={newProperty.state} onChange={(e) => setNewProperty({...newProperty, state: e.target.value.toUpperCase()})} className="rounded-xl border-emerald-100" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Descrição Detalhada</Label>
                            <Textarea 
                                placeholder="Conte mais detalhes sobre o imóvel..."
                                value={newProperty.description}
                                onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                                className="rounded-xl border-emerald-100 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-gray-50 border-t">
                        <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button onClick={handleAddProperty} disabled={isSubmitting} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black px-8">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "PUBLICAR ANÚNCIO"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RealEstateProperties;
