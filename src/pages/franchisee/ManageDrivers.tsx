import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Bike, ShieldCheck, CheckCircle2, XCircle, 
    Search, ExternalLink, Loader2, UserPlus,
    Phone, FileText, MapPin, Calendar, Clock, ArrowLeft, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DriverProfile {
    id: string;
    user_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    cpf_cnpj: string | null;
    avatar_url: string | null;
    driver_address: string | null;
    driver_birth_date: string | null;
    driver_id_photo_url: string | null;
    driver_registration_submitted_at: string | null;
    driver_rejection_reason: string | null;
    driver_vehicle_plate: string | null;
    face_photo_url: string | null;
    is_driver_approved: boolean | null;
    created_at: string;
}

interface NewDriverForm {
    full_name: string;
    email: string;
    password: string;
    phone: string;
    cpf: string;
    driver_address: string;
    driver_vehicle_plate: string;
    driver_birth_date: string;
}

const emptyForm: NewDriverForm = {
    full_name: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    driver_address: "",
    driver_vehicle_plate: "",
    driver_birth_date: "",
};

const ManageFranchiseeDrivers = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [drivers, setDrivers] = useState<DriverProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
    const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [managedCities, setManagedCities] = useState<string[]>([]);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    // New driver form state
    const [isNewDriverOpen, setIsNewDriverOpen] = useState(false);
    const [newDriverForm, setNewDriverForm] = useState<NewDriverForm>(emptyForm);
    const [creatingDriver, setCreatingDriver] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            const { data: citiesRes, error: citiesError } = await supabase
                .from("franchisee_cities" as any)
                .select("cities(name)")
                .eq("franchisee_id", user!.id);

            if (citiesError) throw citiesError;

            const resData = citiesRes as any[];
            const cityNames = resData?.map(c => c.cities?.name).filter(Boolean) || [];
            setManagedCities(cityNames);

            if (cityNames.length === 0) {
                setDrivers([]);
                setLoading(false);
                return;
            }

            // 2. Fetch driver roles
            const { data: driverRoles, error: rolesError } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", "driver");

            if (rolesError) throw rolesError;

            const driverUserIds = driverRoles?.map(r => r.user_id) || [];

            if (driverUserIds.length === 0) {
                setDrivers([]);
                setLoading(false);
                return;
            }

            // 3. Fetch driver profiles
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("*")
                .in("user_id", driverUserIds)
                .order("created_at", { ascending: false });

            if (profilesError) throw profilesError;

            // 4. Filter profiles that match managed cities
            const cityNamesLower = cityNames.map(name => name.toLowerCase());
            const regionalDrivers = (profiles || []).filter(profile => {
                if (!profile.driver_address) return false;
                const addr = profile.driver_address.toLowerCase();
                return cityNamesLower.some(city => addr.includes(city));
            }) as DriverProfile[];

            setDrivers(regionalDrivers);
        } catch (error: any) {
            toast.error("Erro ao carregar entregadores: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateApproval = async (driverId: string, currentStatus: boolean, reason?: string) => {
        setProcessing(true);
        try {
            const updateData: any = { is_driver_approved: !currentStatus };
            if (currentStatus === true) { // If currently approved, we reject it
                updateData.driver_rejection_reason = reason || null;
            } else {
                updateData.driver_rejection_reason = null; // Clear reason on approval
            }

            const { error } = await supabase
                .from("profiles")
                .update(updateData)
                .eq("user_id", driverId);

            if (error) throw error;

            toast.success(!currentStatus ? "Entregador aprovado com sucesso!" : "Cadastro recusado.");
            fetchData();
            setIsDetailsOpen(false);
            setIsRejecting(false);
            setRejectionReason("");
        } catch (error: any) {
            toast.error("Erro ao atualizar status: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleCreateDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDriverForm.full_name || !newDriverForm.email || !newDriverForm.password) {
            toast.error("Nome, e-mail e senha são obrigatórios.");
            return;
        }
        if (newDriverForm.password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setCreatingDriver(true);
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData?.session) throw new Error("Sessão inválida.");

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-driver`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionData.session.access_token}`,
                        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({ driverData: newDriverForm }),
                }
            );

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Erro ao criar entregador.");

            toast.success(`Entregador "${newDriverForm.full_name}" cadastrado com sucesso! Aguarda aprovação.`);
            setIsNewDriverOpen(false);
            setNewDriverForm(emptyForm);
            fetchData();
        } catch (error: any) {
            toast.error("Erro: " + error.message);
        } finally {
            setCreatingDriver(false);
        }
    };

    const filteredDrivers = drivers.filter(d => {
        const matchesSearch = 
            (d.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.phone || "").includes(searchTerm) ||
            (d.cpf_cnpj || "").includes(searchTerm);

        const isApproved = d.is_driver_approved === true;
        const isPending = d.is_driver_approved === false && !d.driver_rejection_reason;
        const isRejected = d.is_driver_approved === false && !!d.driver_rejection_reason;

        const matchesStatus = 
            statusFilter === "all" ||
            (statusFilter === "approved" && isApproved) ||
            (statusFilter === "pending" && isPending) ||
            (statusFilter === "rejected" && isRejected);

        return matchesSearch && matchesStatus;
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
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/franqueado")}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black">Gestão Regional de Entregadores</h1>
                        <p className="text-muted-foreground">Aprovação e controle nas cidades: {managedCities.join(", ")}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-none shadow-soft">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Pendentes</p>
                                <h3 className="text-2xl font-black">{drivers.filter(d => d.is_driver_approved === false && !d.driver_rejection_reason).length}</h3>
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
                                <h3 className="text-2xl font-black">{drivers.filter(d => d.is_driver_approved === true).length}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-soft">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                                <Bike className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                                <h3 className="text-2xl font-black">{drivers.length}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-soft overflow-hidden">
                    <CardHeader className="bg-white border-b border-muted/50 p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <CardTitle className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
                                    <Bike className="w-6 h-6 text-primary" />
                                    Lista de Entregadores
                                </CardTitle>
                                <div className="flex gap-2 flex-wrap">
                                    <Button 
                                        variant={statusFilter === "all" ? "default" : "outline"} 
                                        size="sm" 
                                        onClick={() => setStatusFilter("all")}
                                    >
                                        Todos
                                    </Button>
                                    <Button 
                                        variant={statusFilter === "pending" ? "default" : "outline"} 
                                        size="sm" 
                                        onClick={() => setStatusFilter("pending")}
                                    >
                                        Pendentes
                                    </Button>
                                    <Button 
                                        variant={statusFilter === "approved" ? "default" : "outline"} 
                                        size="sm" 
                                        onClick={() => setStatusFilter("approved")}
                                    >
                                        Aprovados
                                    </Button>
                                    <Button 
                                        variant={statusFilter === "rejected" ? "default" : "outline"} 
                                        size="sm" 
                                        onClick={() => setStatusFilter("rejected")}
                                    >
                                        Recusados
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Buscar por nome ou CPF..." 
                                        className="pl-10 h-11 rounded-xl border-muted"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="h-11 px-5 rounded-xl font-bold uppercase text-xs gap-2 shrink-0"
                                    onClick={() => setIsNewDriverOpen(true)}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Novo Entregador
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-muted/50">
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entregador</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telefone</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Placa</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/30">
                                    {filteredDrivers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground font-medium">
                                                Nenhum entregador encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDrivers.map((driver) => (
                                            <tr key={driver.id} className="hover:bg-muted/10 transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        {driver.avatar_url ? (
                                                            <img 
                                                                src={driver.avatar_url} 
                                                                className="w-10 h-10 rounded-xl object-cover border" 
                                                                alt={driver.full_name} 
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                                                                {driver.full_name?.[0]}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-bold text-sm">{driver.full_name}</p>
                                                            <p className="text-xs text-muted-foreground">{driver.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-medium">{driver.phone || "-"}</td>
                                                <td className="p-4 text-sm font-mono">{driver.driver_vehicle_plate || "-"}</td>
                                                <td className="p-4 text-center">
                                                    <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase ${
                                                        driver.is_driver_approved === true ? 'bg-emerald-100 text-emerald-700' :
                                                        (driver.is_driver_approved === false && !driver.driver_rejection_reason) ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {driver.is_driver_approved === true ? 'Aprovado' : 
                                                         (driver.is_driver_approved === false && !driver.driver_rejection_reason) ? 'Pendente' : 'Recusado'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-primary font-bold hover:bg-primary/10"
                                                        onClick={() => {
                                                            setSelectedDriver(driver);
                                                            setIsDetailsOpen(true);
                                                        }}
                                                    >
                                                        DETALHES
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDetailsOpen} onOpenChange={(open) => {
                setIsDetailsOpen(open);
                if(!open) {
                    setIsRejecting(false);
                    setRejectionReason("");
                }
            }}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck className="w-20 h-20" />
                        </div>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter mb-1">Ficha do Entregador</DialogTitle>
                        <DialogDescription className="text-white/80">Avaliação de credenciamento regional</DialogDescription>
                    </div>

                    <div className="p-8 space-y-6 bg-white max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-bold text-sm text-primary uppercase border-b pb-1">Dados Pessoais</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Completo</Label>
                                        <p className="font-bold text-gray-800">{selectedDriver?.full_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telefone</Label>
                                        <p className="font-bold text-gray-800">{selectedDriver?.phone || "Não informado"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CPF</Label>
                                        <p className="font-bold text-gray-800">{selectedDriver?.cpf_cnpj || "Não informado"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data de Nascimento</Label>
                                        <p className="font-bold text-gray-800">
                                            {selectedDriver?.driver_birth_date ? new Date(selectedDriver.driver_birth_date).toLocaleDateString("pt-BR") : "Não informada"}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Endereço Completo</Label>
                                        <p className="font-bold text-gray-800 flex items-start gap-1">
                                            <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                            {selectedDriver?.driver_address || "Não informado"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-sm text-primary uppercase border-b pb-1">Veículo</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Placa do Veículo</Label>
                                        <p className="font-bold text-gray-800 font-mono">{selectedDriver?.driver_vehicle_plate || "Não informada"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Document Photos */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-bold text-sm text-primary uppercase pb-1">Fotos enviadas</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedDriver?.face_photo_url && (
                                    <div className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-2xl border">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground self-start">Foto de Rosto (Selfie)</Label>
                                        <img 
                                            src={selectedDriver.face_photo_url} 
                                            className="w-full h-40 object-cover rounded-xl border shadow-sm"
                                            alt="Selfie"
                                        />
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full mt-1"
                                            onClick={() => window.open(selectedDriver.face_photo_url!, "_blank")}
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ampliar Foto
                                        </Button>
                                    </div>
                                )}
                                {selectedDriver?.driver_id_photo_url && (
                                    <div className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-2xl border">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground self-start">Documento de Identificação (RG/CNH)</Label>
                                        <img 
                                            src={selectedDriver.driver_id_photo_url} 
                                            className="w-full h-40 object-cover rounded-xl border shadow-sm"
                                            alt="Documento"
                                        />
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full mt-1"
                                            onClick={() => window.open(selectedDriver.driver_id_photo_url!, "_blank")}
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ampliar Doc
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rejection / Reasons Panel */}
                        {isRejecting && (
                            <div className="space-y-3 bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-800/20">
                                <Label className="text-xs font-bold text-red-600 uppercase">Motivo da Recusa</Label>
                                <Textarea
                                    placeholder="Descreva o motivo pelo qual o entregador está sendo recusado..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-[80px] bg-background border-red-200 focus-visible:ring-red-500"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="flex-1 font-bold uppercase text-xs"
                                        onClick={() => handleUpdateApproval(selectedDriver!.user_id, true, rejectionReason)}
                                        disabled={processing || !rejectionReason.trim()}
                                    >
                                        Confirmar Recusa
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="flex-1 font-bold uppercase text-xs"
                                        onClick={() => {
                                            setIsRejecting(false);
                                            setRejectionReason("");
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {selectedDriver?.driver_rejection_reason && !isRejecting && !selectedDriver.is_driver_approved && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-800/20">
                                <p className="text-xs font-bold text-red-600 uppercase mb-1">Motivo Atual da Recusa</p>
                                <p className="text-sm italic text-muted-foreground">"{selectedDriver.driver_rejection_reason}"</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-8 bg-gray-50 border-t flex-col sm:flex-row gap-3">
                        <div className="flex justify-between items-center w-full gap-3">
                            <div className="flex-1 flex gap-3">
                                {selectedDriver?.is_driver_approved ? (
                                    <Button 
                                        variant="destructive"
                                        className="h-12 flex-1 rounded-xl font-bold uppercase text-xs"
                                        onClick={() => setIsRejecting(true)}
                                        disabled={processing || isRejecting}
                                    >
                                        Desativar / Recusar
                                    </Button>
                                ) : (
                                    <>
                                        <Button 
                                            className="h-12 flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold uppercase text-xs"
                                            onClick={() => handleUpdateApproval(selectedDriver!.user_id, false)}
                                            disabled={processing || isRejecting}
                                        >
                                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "APROVAR CADASTRO"}
                                        </Button>
                                        <Button 
                                            variant="destructive"
                                            className="h-12 flex-1 rounded-xl font-bold uppercase text-xs"
                                            onClick={() => setIsRejecting(true)}
                                            disabled={processing || isRejecting}
                                        >
                                            RECUSAR
                                        </Button>
                                    </>
                                )}
                            </div>
                            <Button 
                                variant="outline"
                                className="h-12 rounded-xl font-bold uppercase text-xs px-6"
                                onClick={() => setIsDetailsOpen(false)}
                            >
                                Fechar
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Driver Registration Dialog */}
            <Dialog open={isNewDriverOpen} onOpenChange={(open) => {
                setIsNewDriverOpen(open);
                if (!open) {
                    setNewDriverForm(emptyForm);
                    setShowPassword(false);
                }
            }}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <UserPlus className="w-20 h-20" />
                        </div>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter mb-1">
                            Cadastrar Entregador
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            O entregador ficará com status <strong>Pendente</strong> até ser aprovado.
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleCreateDriver}>
                        <div className="p-8 space-y-6 bg-white max-h-[65vh] overflow-y-auto">
                            {/* Personal Data */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-sm text-primary uppercase border-b pb-2">Dados Pessoais</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nd-full-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            Nome Completo <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="nd-full-name"
                                            placeholder="João da Silva"
                                            value={newDriverForm.full_name}
                                            onChange={(e) => setNewDriverForm(f => ({ ...f, full_name: e.target.value }))}
                                            className="rounded-xl h-11"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nd-phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            Telefone / WhatsApp
                                        </Label>
                                        <Input
                                            id="nd-phone"
                                            placeholder="(99) 99999-9999"
                                            value={newDriverForm.phone}
                                            onChange={(e) => setNewDriverForm(f => ({ ...f, phone: e.target.value }))}
                                            className="rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nd-cpf" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            CPF
                                        </Label>
                                        <Input
                                            id="nd-cpf"
                                            placeholder="000.000.000-00"
                                            value={newDriverForm.cpf}
                                            onChange={(e) => setNewDriverForm(f => ({ ...f, cpf: e.target.value }))}
                                            className="rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nd-birth" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            Data de Nascimento
                                        </Label>
                                        <Input
                                            id="nd-birth"
                                            type="date"
                                            value={newDriverForm.driver_birth_date}
                                            onChange={(e) => setNewDriverForm(f => ({ ...f, driver_birth_date: e.target.value }))}
                                            className="rounded-xl h-11"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="nd-address" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        Endereço Completo
                                    </Label>
                                    <Input
                                        id="nd-address"
                                        placeholder={`Rua Exemplo, 123 - ${managedCities[0] || 'Cidade'}`}
                                        value={newDriverForm.driver_address}
                                        onChange={(e) => setNewDriverForm(f => ({ ...f, driver_address: e.target.value }))}
                                        className="rounded-xl h-11"
                                    />
                                </div>
                            </div>

                            {/* Vehicle */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-sm text-primary uppercase border-b pb-2">Veículo</h3>
                                <div className="space-y-1.5">
                                    <Label htmlFor="nd-plate" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        Placa do Veículo
                                    </Label>
                                    <Input
                                        id="nd-plate"
                                        placeholder="ABC-1234"
                                        value={newDriverForm.driver_vehicle_plate}
                                        onChange={(e) => setNewDriverForm(f => ({ ...f, driver_vehicle_plate: e.target.value.toUpperCase() }))}
                                        className="rounded-xl h-11 font-mono uppercase"
                                        maxLength={8}
                                    />
                                </div>
                            </div>

                            {/* Account Access */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-sm text-primary uppercase border-b pb-2">Acesso ao Aplicativo</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nd-email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            E-mail <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="nd-email"
                                            type="email"
                                            placeholder="entregador@email.com"
                                            value={newDriverForm.email}
                                            onChange={(e) => setNewDriverForm(f => ({ ...f, email: e.target.value }))}
                                            className="rounded-xl h-11"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nd-password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            Senha de Acesso <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="nd-password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Mínimo 6 caracteres"
                                                value={newDriverForm.password}
                                                onChange={(e) => setNewDriverForm(f => ({ ...f, password: e.target.value }))}
                                                className="rounded-xl h-11 pr-12"
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl p-3">
                                    ⚠️ Informe as credenciais ao entregador para que ele acesse o aplicativo. O cadastro ficará pendente até ser aprovado por você.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="p-8 bg-gray-50 border-t flex-col sm:flex-row gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 flex-1 rounded-xl font-bold uppercase text-xs"
                                onClick={() => setIsNewDriverOpen(false)}
                                disabled={creatingDriver}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="h-12 flex-1 rounded-xl font-bold uppercase text-xs"
                                disabled={creatingDriver}
                            >
                                {creatingDriver ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Cadastrando...</>
                                ) : (
                                    <><UserPlus className="w-4 h-4 mr-2" /> Cadastrar Entregador</>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageFranchiseeDrivers;
