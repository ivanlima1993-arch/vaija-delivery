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
import AdminSidebar from "@/components/admin/AdminSidebar";
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

const AdminServiceProviders = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, isAdmin } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [isAddMode, setIsAddMode] = useState(false);
    const [pendingEstablishments, setPendingEstablishments] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        category: "",
        description: "",
        image_url: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=400&fit=crop",
        rating: 5.0,
        is_active: true,
    });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
            return;
        }

        if (!authLoading && user && !isAdmin) {
            toast.error("Acesso negado. Área restrita para administradores.");
            navigate("/");
            return;
        }

        if (user && isAdmin) {
            fetchProviders();
            fetchPendingEstablishments();
        }
    }, [user, authLoading, isAdmin, navigate]);

    const fetchPendingEstablishments = async () => {
        const { count } = await supabase
            .from("establishments")
            .select("*", { count: "exact", head: true })
            .eq("is_approved", false);
        setPendingEstablishments(count || 0);
    };

    const fetchProviders = async () => {
        try {
            // Since the table might not exist yet, we handle the error gracefully
            const { data, error } = await supabase
                .from("service_providers" as any)
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.warn("Table service_providers does not exist, using mock data");
                // Initial mock data if table doesn't exist
                setProviders([
                    {
                        id: "1",
                        name: "Ricardo Silva",
                        category: "Elétrica",
                        phone: "(79) 99999-9999",
                        rating: 4.9,
                        is_active: true,
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: "2",
                        name: "Ana Oliveira",
                        category: "Limpeza",
                        phone: "(79) 88888-8888",
                        rating: 5.0,
                        is_active: true,
                        created_at: new Date().toISOString(),
                    }
                ]);
            } else {
                setProviders(data || []);
            }
        } catch (error) {
            console.error("Error fetching providers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProvider = async () => {
        if (!formData.name || !formData.phone || !formData.category) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("service_providers" as any)
                .insert([formData])
                .select();

            if (error) {
                if (error.code === "PGRST116" || error.message.includes("not found")) {
                    // Table doesn't exist - simulated success for UX
                    const newProvider = {
                        ...formData,
                        id: Math.random().toString(36).substr(2, 9),
                        created_at: new Date().toISOString(),
                    };
                    setProviders([newProvider, ...providers]);
                    toast.info("Simulação: Profissional adicionado (Tabela não existe no Banco)");
                } else {
                    throw error;
                }
            } else {
                setProviders([data[0], ...providers]);
                toast.success("Profissional adicionado com sucesso!");
            }

            setIsAddMode(false);
            setFormData({
                name: "",
                phone: "",
                category: "",
                description: "",
                image_url: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=400&fit=crop",
                rating: 5.0,
                is_active: true,
            });
        } catch (error: any) {
            toast.error("Erro ao adicionar profissional: " + error.message);
        }
    };

    const handleDeleteProvider = async (id: string) => {
        try {
            const { error } = await supabase
                .from("service_providers" as any)
                .delete()
                .eq("id", id);

            if (error && !error.message.includes("not found")) throw error;

            setProviders(providers.filter(p => p.id !== id));
            toast.success("Profissional removido");
        } catch (error) {
            toast.error("Erro ao remover profissional");
        }
    };

    const filteredProviders = providers.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone.includes(searchTerm);
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
        <div className="min-h-screen bg-background flex">
            <AdminSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                pendingEstablishments={pendingEstablishments}
            />

            <main className="flex-1 overflow-auto">
                <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="font-bold text-lg">Gerenciar Profissionais</h1>
                                <p className="text-sm text-muted-foreground">
                                    Painel de profissionais do Vai Já Serviços
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => setIsAddMode(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Profissional
                        </Button>
                    </div>
                </header>

                <div className="p-4 lg:p-6 space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar profissional..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-full sm:w-48">
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

                    {/* List */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Profissional</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead>Telefone</TableHead>
                                            <TableHead>Avaliação</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProviders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                    Nenhum profissional cadastrado.
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
                                                            <span className="font-bold">{pro.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                            {pro.category}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{pro.phone}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                            <span className="font-bold">{pro.rating}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={pro.is_active ? "default" : "secondary"}>
                                                            {pro.is_active ? "Ativo" : "Inativo"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDeleteProvider(pro.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
            </main>

            {/* Add Dialog */}
            <Dialog open={isAddMode} onOpenChange={setIsAddMode}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Profissional</DialogTitle>
                        <DialogDescription>
                            Preencha os dados do profissional para o Vai Já Serviços.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                placeholder="Ex: João Silva"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                                <Input
                                    id="phone"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Categoria</Label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
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
                            <Label htmlFor="desc">Descrição/Especialidade</Label>
                            <Input
                                id="desc"
                                placeholder="Ex: Eletricista predial e residencial"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddMode(false)}>Cancelar</Button>
                        <Button onClick={handleAddProvider}>Salvar Profissional</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminServiceProviders;
