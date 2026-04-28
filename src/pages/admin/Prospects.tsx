import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, Building2, UserPlus, Search, Pencil, Trash2, Phone, Calendar, MessageSquare, MessageCircle } from "lucide-react";

export default function AdminProspects() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "business",
    contact_info: "",
    city: "",
    status: "Novo",
    notes: ""
  });

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (error: any) {
      console.error('Error fetching prospects:', error);
      // Fail silently for users if table doesn't exist yet, just show empty
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (prospect?: any) => {
    if (prospect) {
      setEditingId(prospect.id);
      setFormData({
        name: prospect.name || "",
        type: prospect.type || "business",
        contact_info: prospect.contact_info || "",
        city: prospect.city || "",
        status: prospect.status || "Novo",
        notes: prospect.notes || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        type: "business",
        contact_info: "",
        city: "",
        status: "Novo",
        notes: ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name) {
        toast.error("O nome é obrigatório");
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from('prospects')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success("Lead atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('prospects')
          .insert([formData]);
        
        if (error) throw error;
        toast.success("Novo lead adicionado com sucesso!");
      }

      setIsDialogOpen(false);
      fetchProspects();
    } catch (error: any) {
      console.error('Error saving prospect:', error);
      toast.error("Erro ao salvar lead. A tabela prospects existe?");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este lead?")) return;

    try {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Lead excluído com sucesso!");
      fetchProspects();
    } catch (error: any) {
      console.error('Error deleting prospect:', error);
      toast.error("Erro ao excluir lead");
    }
  };

  const filteredProspects = prospects.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contact_info?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWhatsApp = (prospect: any) => {
    if (!prospect.contact_info) {
      toast.error("Nenhum telefone registrado para este lead.");
      return;
    }
    
    // Clean phone number (remove non-digits)
    const phoneLimpo = prospect.contact_info.replace(/\D/g, "");
    
    if (phoneLimpo.length < 10) {
      toast.error("Número de telefone parece inválido.");
      return;
    }

    const isBusiness = prospect.type === 'business';
    const message = `Olá ${prospect.name}! Somos do Vai Já Delivery. Vimos que você tem interesse em ser nosso parceiro como ${isBusiness ? 'estabelecimento' : 'profissional'}. Como podemos ajudar?`;
    
    const url = `https://wa.me/55${phoneLimpo}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Novo': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'Em Contato': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
      case 'Convertido': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      case 'Recusado': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM / Prospecção</h1>
          <p className="text-muted-foreground">
            Gerencie contatos de possíveis comércios e prestadores.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Novo Lead
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
              </TableRow>
            ) : filteredProspects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProspects.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {prospect.type === 'business' ? (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Users className="w-4 h-4 text-muted-foreground" />
                      )}
                      {prospect.name}
                    </div>
                    {prospect.notes && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate max-w-[200px]">
                        <MessageSquare className="w-3 h-3" />
                        {prospect.notes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {prospect.type === 'business' ? 'Comércio' : 'Profissional'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {prospect.contact_info || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{prospect.city || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(prospect.status)} variant="outline">
                      {prospect.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                      onClick={() => handleWhatsApp(prospect)}
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(prospect)} title="Editar Lead">
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(prospect.id)} title="Excluir Lead">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Nome do Comércio ou Pessoa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Pizzaria do João"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Perfil Alvo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Comércio (Restaurante, Loja...)</SelectItem>
                    <SelectItem value="person">Profissional (Entregador, Prestador...)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Fase da Prospecção</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Novo">Novo (Para Contatar)</SelectItem>
                    <SelectItem value="Em Contato">Em Contato (Negociando)</SelectItem>
                    <SelectItem value="Convertido">Convertido (Cadastrado)</SelectItem>
                    <SelectItem value="Recusado">Recusado / Sem Interesse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="contact">Telefone / Email</Label>
                <Input
                  id="contact"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: São Paulo"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Anotações do Contato</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Registros da conversa, valores negociados, próxima data de contato..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
