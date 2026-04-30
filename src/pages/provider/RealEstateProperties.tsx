import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building, Plus, MapPin, DollarSign, Bed, Bath, Car, ArrowLeft, Loader2, Image as ImageIcon, X, LogOut } from "lucide-react";
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
    const [properties, setProperties] = useState<any[]>([]);
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
            
            fetchProperties();
        };

        checkApproval();
    }, [user, navigate]);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("real_estate_properties")
                .select(`
                    *,
                    real_estate_images (url)
                `)
                .eq("owner_id", user?.id)
                .order("created_at", { ascending: false });
                
            if (error) {
                console.error("Fetch properties error:", error);
            } else {
                setProperties(data || []);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
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
            toast.error("Preencha os campos obrigatórios (Título, Preço e Cidade)");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Inserir o imóvel
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

            // 2. Upload das imagens (se houver)
            if (selectedImages.length > 0) {
                for (const file of selectedImages) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${propertyData.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('properties')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error("Erro no upload da imagem:", uploadError);
                        continue;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('properties')
                        .getPublicUrl(filePath);

                    // Salvar URL na tabela real_estate_images
                    await supabase
                        .from("real_estate_images")
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
            resetForm();
        } catch (error: any) {
            toast.error("Erro ao cadastrar imóvel: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewProperty({
            title: "",
            description: "",
            transaction_type: "sale",
            property_type: "Apartamento",
            price: "",
            bedrooms: "0",
            bathrooms: "0",
            parking_spots: "0",
            address: "",
            city: "",
            state: "SP"
        });
        setSelectedImages([]);
        setPreviews([]);
    };

    return (
        <div className="min-h-screen bg-[#fafafa] pb-20">
            {/* Header */}
            <div className="bg-emerald-700 text-white p-6 shadow-md rounded-b-[2rem] sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
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
                            <p className="text-emerald-100 text-sm">Gerencie seus anúncios de imóveis</p>
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
                <div className="flex gap-2">
                    <Button 
                        className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold flex-1"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Imóvel
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 mt-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-600"></div>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-[2rem] border border-gray-100 shadow-sm mt-8">
                        <div className="bg-emerald-50 p-4 rounded-full mb-4">
                            <Building className="w-12 h-12 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhum imóvel cadastrado</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Você ainda não cadastrou nenhum imóvel na sua carteira.
                        </p>
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-white w-full"
                            onClick={() => setIsAddDialogOpen(true)}
                        >
                            Cadastrar Primeiro Imóvel
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {properties.map((property) => (
                            <Card key={property.id} className="rounded-2xl overflow-hidden border-none shadow-md">
                                <div className="h-40 bg-gray-200 relative">
                                    {property.real_estate_images?.[0] ? (
                                        <img 
                                            src={property.real_estate_images[0].url} 
                                            alt={property.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            <Building className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Badge className={property.transaction_type === 'sale' ? 'bg-blue-600' : 'bg-emerald-600'}>
                                            {property.transaction_type === 'sale' ? 'Venda' : 'Aluguel'}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="mb-2">
                                        <p className="text-xs text-muted-foreground font-bold uppercase">{property.property_type}</p>
                                        <h3 className="font-bold text-lg leading-tight truncate">{property.title}</h3>
                                        <p className="text-emerald-700 font-black text-xl mt-1">
                                            R$ {Number(property.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3 truncate">
                                        <MapPin className="w-3 h-3" />
                                        {property.city}, {property.state}
                                    </div>
                                    <div className="flex gap-4 text-sm text-gray-600 border-t pt-3">
                                        {property.bedrooms > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Bed className="w-4 h-4" /> {property.bedrooms}
                                            </div>
                                        )}
                                        {property.bathrooms > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Bath className="w-4 h-4" /> {property.bathrooms}
                                            </div>
                                        )}
                                        {property.parking_spots > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Car className="w-4 h-4" /> {property.parking_spots}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Property Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                if (!open) resetForm();
                setIsAddDialogOpen(open);
            }}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-emerald-700">Novo Imóvel</DialogTitle>
                        <DialogDescription>Preencha os dados do imóvel para anunciar na plataforma.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Imagens */}
                        <div className="space-y-2">
                            <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Fotos do Imóvel</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {previews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="aspect-square rounded-xl border-2 border-dashed border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center cursor-pointer">
                                    <ImageIcon className="w-6 h-6 text-emerald-600 mb-1" />
                                    <span className="text-[10px] font-bold text-emerald-700">Adicionar</span>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Título do Anúncio</Label>
                            <Input 
                                id="title" 
                                placeholder="Ex: Apartamento de Luxo no Centro"
                                value={newProperty.title}
                                onChange={(e) => setNewProperty({...newProperty, title: e.target.value})}
                                className="rounded-xl border-emerald-100 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Tipo de Negócio</Label>
                                <Select 
                                    value={newProperty.transaction_type} 
                                    onValueChange={(val: any) => setNewProperty({...newProperty, transaction_type: val})}
                                >
                                    <SelectTrigger className="rounded-xl border-emerald-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sale">Venda</SelectItem>
                                        <SelectItem value="rent">Aluguel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Tipo de Imóvel</Label>
                                <Select 
                                    value={newProperty.property_type} 
                                    onValueChange={(val) => setNewProperty({...newProperty, property_type: val})}
                                >
                                    <SelectTrigger className="rounded-xl border-emerald-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Apartamento">Apartamento</SelectItem>
                                        <SelectItem value="Casa">Casa</SelectItem>
                                        <SelectItem value="Terreno">Terreno</SelectItem>
                                        <SelectItem value="Comercial">Comercial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Valor (R$)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                                <Input 
                                    id="price" 
                                    type="number"
                                    placeholder="0,00"
                                    value={newProperty.price}
                                    onChange={(e) => setNewProperty({...newProperty, price: e.target.value})}
                                    className="pl-10 rounded-xl border-emerald-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Quartos</Label>
                                <Input 
                                    type="number" 
                                    value={newProperty.bedrooms}
                                    onChange={(e) => setNewProperty({...newProperty, bedrooms: e.target.value})}
                                    className="rounded-xl border-emerald-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Banheiros</Label>
                                <Input 
                                    type="number" 
                                    value={newProperty.bathrooms}
                                    onChange={(e) => setNewProperty({...newProperty, bathrooms: e.target.value})}
                                    className="rounded-xl border-emerald-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Vagas</Label>
                                <Input 
                                    type="number" 
                                    value={newProperty.parking_spots}
                                    onChange={(e) => setNewProperty({...newProperty, parking_spots: e.target.value})}
                                    className="rounded-xl border-emerald-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Cidade</Label>
                                <Input 
                                    id="city" 
                                    value={newProperty.city}
                                    onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
                                    className="rounded-xl border-emerald-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Estado (UF)</Label>
                                <Input 
                                    id="state" 
                                    maxLength={2}
                                    value={newProperty.state}
                                    onChange={(e) => setNewProperty({...newProperty, state: e.target.value.toUpperCase()})}
                                    className="rounded-xl border-emerald-100"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Descrição</Label>
                            <Textarea 
                                id="description" 
                                placeholder="Conte mais detalhes sobre o imóvel..."
                                value={newProperty.description}
                                onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                                className="rounded-xl border-emerald-100 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsAddDialogOpen(false)}
                            className="rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleAddProperty}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 font-bold"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            CADASTRAR IMÓVEL
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RealEstateProperties;
