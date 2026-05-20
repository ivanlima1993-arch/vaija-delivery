import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
    Wrench,
    Search,
    Menu,
    Plus,
    Trash2,
    User,
    Star,
    MapPin,
    FileText,
    Calendar,
    Home,
    DollarSign,
    CheckCircle,
    XCircle,
    Check,
    X,
    ArrowLeft,
    Loader2
} from "lucide-react";

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

const ManageServiceProviders = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [isAddMode, setIsAddMode] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<any>(null);
    const [cities, setCities] = useState<any[]>([]);
    const [managedCityIds, setManagedCityIds] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        category: "",
        description: "",
        address: "",
        cpf: "",
        birth_date: "",
        city_id: "",
        image_url: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=400&fit=crop",
        rating: 5.0,
        is_active: true,
        wallet_balance: 0
    });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
            return;
        }

        if (user) {
            fetchData();
        }
    }, [user, authLoading]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // 1. Fetch managed cities
            const { data: citiesRes } = await supabase
                .from("franchisee_cities" as any)
                .select("city_id, cities(name, id)")
                .eq("franchisee_id", user!.id);

            const cityIds = citiesRes?.map(c => c.city_id) || [];
            const managedCitiesData = citiesRes?.map(c => c.cities) || [];
            setManagedCityIds(cityIds);
            setCities(managedCitiesData);

            // 2. Fetch providers in these cities
            const { data, error } = await supabase
                .from("service_providers" as any)
                .select("*")
                .in("city_id", cityIds)
                .order("created_at", { ascending: false });

            if (error) {
                console.warn("Table service_providers handling:", error);
                setProviders([]);
            } else {
                setProviders(data || []);
            }
        } catch (error) {
            console.error("Error fetching providers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("service_providers")
                .update({ is_active: !currentStatus })
                .eq("id", id);
            
            if (error) throw error;
            
            setProviders(providers.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
            toast.success(currentStatus ? "Profissional desativado" : "Profissional aprovado!");
        } catch (error) {
            toast.error("Erro ao atualizar status");
        }
    };

    const handleUpdateBalance = async (provider: any, newBalance: number) => {
        const diff = newBalance - (provider.wallet_balance || 0);
        if (diff === 0) return;

        try {
            const { error } = await supabase
                .from("wallet_transactions" as any)
                .insert([{
                    user_id: provider.user_id,
                    amount: Math.abs(diff),
                    type: diff > 0 ? "credit" : "debit",
                    description: `Ajuste Regional - Franqueado: ${user?.email}`
                }]);
            
            if (error) throw error;
            
            setProviders(providers.map(p => p.id === provider.id ? { ...p, wallet_balance: newBalance } : p));
            toast.success("Saldo atualizado");
        } catch (error: any) {
            toast.error("Erro ao atualizar saldo: " + error.message);
        }
    };

    const handleAddProvider = async () => {
        if (!formData.name || !formData.phone || !formData.category || !formData.city_id) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setProcessing(true);
        try {
            const { data, error } = await supabase
                .from("service_providers" as any)
                .insert([{
                    ...formData,
                    id: crypto.randomUUID(),
                    full_name: formData.name
                }])
                .select();

            if (error) throw error;
            
            setProviders([data[0], ...providers]);
            toast.success("Profissional adicionado!");
            setIsAddMode(false);
            setFormData({
                name: "",
                phone: "",
                category: "",
                description: "",
                address: "",
                cpf: "",
                birth_date: "",
                city_id: "",
                image_url: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=400&fit=crop",
                rating: 5.0,
                is_active: true,
                wallet_balance: 0
            });
        } catch (error: any) {
            toast.error("Erro ao adicionar: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const filteredProviders = providers.filter(p => {
        const name = (p.name || p.full_name || "").toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || p.phone?.includes(searchTerm);
        const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate("/franqueado")}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black">Gestão Regional de Serviços</h1>
                            <p className="text-sm text-muted-foreground">Monitoramento de profissionais e suporte local</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsAddMode(true)} className="gap-2">
                        <Plus className="w-4 h-4" /> Novo Profissional
                    </Button>
                </div>

                <Card className="border-none shadow-soft">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar profissional..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11"
                                />
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-48 h-11">
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Profissional</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Cidade</TableHead>
                                        <TableHead>Saldo</TableHead>
                                        <TableHead>Status</TableHead>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProviders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-medium">
                                                Nenhum profissional cadastrado na sua região.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProviders.map((pro) => (
                                            <TableRow key={pro.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <span className="font-bold">{pro.name || pro.full_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                        {pro.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{cities.find(c => c.id === pro.city_id)?.name || "N/A"}</TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-primary">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pro.wallet_balance || 0)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={pro.is_active ? "default" : "secondary"} className={pro.is_active ? "bg-green-500 hover:bg-green-500" : ""}>
                                                        {pro.is_active ? "Ativo" : "Pendente"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-primary font-bold hover:bg-primary/10"
                                                        onClick={() => setSelectedProvider(pro)}
                                                    >
                                                        DETALHES
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Same Dilogs as ServiceProviders with Regional Scope */}
             <Dialog open={isAddMode} onOpenChange={setIsAddMode}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Novo Profissional</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div><Label>Nome Completo</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Telefone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                            <div><Label>Categoria</Label>
                                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div><Label>Cidade de Atuação</Label>
                            <Select value={formData.city_id} onValueChange={v => setFormData({...formData, city_id: v})}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddMode(false)}>Cancelar</Button>
                        <Button onClick={handleAddProvider} disabled={processing}>{processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Detalhes do Profissional</DialogTitle></DialogHeader>
                    {selectedProvider && (
                        <div className="space-y-6 py-4">
                             <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                                    {selectedProvider.image_url ? <img src={selectedProvider.image_url} className="w-full h-full object-cover" /> : <User className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedProvider.name || selectedProvider.full_name}</h3>
                                    <Badge variant="outline">{selectedProvider.category}</Badge>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><Label className="text-xs text-muted-foreground">Telefone</Label><p className="font-bold">{selectedProvider.phone}</p></div>
                                <div><Label className="text-xs text-muted-foreground">CPF</Label><p className="font-bold">{selectedProvider.cpf || "N/A"}</p></div>
                                <div className="col-span-2"><Label className="text-xs text-muted-foreground">Endereço</Label><p className="font-bold">{selectedProvider.address}</p></div>
                             </div>
                             <div className="pt-4 border-t flex justify-between gap-4">
                                <Button variant={selectedProvider.is_active ? "destructive" : "default"} className="flex-1" onClick={() => {
                                    handleToggleStatus(selectedProvider.id, selectedProvider.is_active);
                                    setSelectedProvider(null);
                                }}>
                                    {selectedProvider.is_active ? "Desativar" : "Aprovar Profissional"}
                                </Button>
                             </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageServiceProviders;
