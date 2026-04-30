import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Building, ShieldCheck, CheckCircle2, XCircle, 
    Search, Filter, ExternalLink, Loader2, User,
    Phone, FileText, MapPin, Calendar, Clock, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";

const AdminRealtors = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, isAdmin } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [realtors, setRealtors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRealtor, setSelectedRealtor] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
            return;
        }

        if (!authLoading && user && !isAdmin) {
            toast.error("Acesso negado.");
            navigate("/");
            return;
        }

        if (user && isAdmin) {
            fetchRealtors();
        }
    }, [user, authLoading, isAdmin, navigate]);

    const fetchRealtors = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("real_estate_realtors")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRealtors(data || []);
        } catch (error: any) {
            toast.error("Erro ao carregar corretores: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
        setProcessing(true);
        try {
            const { error } = await supabase
                .from("real_estate_realtors")
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq("id", id);

            if (error) throw error;

            toast.success(newStatus === 'approved' ? "Corretor aprovado com sucesso!" : "Cadastro rejeitado.");
            fetchRealtors();
            setIsDetailsOpen(false);
        } catch (error: any) {
            toast.error("Erro ao atualizar: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const filteredRealtors = realtors.filter(r => 
        r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.creci.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            />
            
            <main className="flex-1 overflow-auto">
                {/* Header Inline */}
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
                                <h1 className="font-bold text-lg">Gestão de Corretores</h1>
                                <p className="text-sm text-muted-foreground">
                                    Aprovação e verificação de CRECI
                                </p>
                            </div>
                        </div>
                    </div>
                </header>
                
                <div className="p-4 lg:p-6 space-y-6">
                    {/* Stats Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-soft">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Pendentes</p>
                                    <h3 className="text-2xl font-black">{realtors.filter(r => r.status === 'pending').length}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-soft">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Aprovados</p>
                                    <h3 className="text-2xl font-black">{realtors.filter(r => r.status === 'approved').length}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-soft">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                                    <Building className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                                    <h3 className="text-2xl font-black">{realtors.length}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* List */}
                    <Card className="border-none shadow-soft overflow-hidden">
                        <CardHeader className="bg-white border-b border-muted/50 p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <CardTitle className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
                                    <User className="w-6 h-6 text-primary" />
                                    Lista de Corretores
                                </CardTitle>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Buscar por nome ou CRECI..." 
                                        className="pl-10 h-11 rounded-xl border-muted"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/30 border-b border-muted/50">
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">CRECI</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Localização</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {filteredRealtors.map((realtor) => (
                                            <tr key={realtor.id} className="hover:bg-muted/10 transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                                                            {realtor.full_name[0]}
                                                        </div>
                                                        <p className="font-bold text-sm">{realtor.full_name}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-medium">{realtor.creci}</td>
                                                <td className="p-4 text-sm font-medium text-muted-foreground">
                                                    {realtor.city}, {realtor.state}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase ${
                                                        realtor.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                        realtor.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {realtor.status === 'approved' ? 'Aprovado' : 
                                                         realtor.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-primary font-bold hover:bg-primary/10"
                                                        onClick={() => {
                                                            setSelectedRealtor(realtor);
                                                            setIsDetailsOpen(true);
                                                        }}
                                                    >
                                                        DETALHES
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Realtor Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck className="w-20 h-20" />
                        </div>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter mb-1">Análise de Corretor</DialogTitle>
                    </div>

                    <div className="p-8 space-y-6 bg-white">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Completo</Label>
                                <p className="font-bold text-gray-800">{selectedRealtor?.full_name}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CRECI</Label>
                                <p className="font-bold text-primary">{selectedRealtor?.creci}</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-gray-50 border-t flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button 
                                className="h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black uppercase text-xs"
                                onClick={() => handleUpdateStatus(selectedRealtor.id, 'approved')}
                                disabled={processing || selectedRealtor?.status === 'approved'}
                            >
                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "APROVAR"}
                            </Button>
                            <Button 
                                variant="destructive"
                                className="h-14 rounded-2xl font-black uppercase text-xs"
                                onClick={() => handleUpdateStatus(selectedRealtor.id, 'rejected')}
                                disabled={processing || selectedRealtor?.status === 'rejected'}
                            >
                                REJEITAR
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminRealtors;
