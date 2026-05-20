import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cities: any[];
}

export const NewLeadDialog = ({ open, onOpenChange, cities }: NewLeadDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_info: "",
    city: "",
    status: "Novo",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city) {
      toast.error("Selecione uma cidade");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("prospects").insert({
        name: formData.name,
        contact_info: formData.contact_info,
        city: formData.city,
        status: formData.status,
      });

      if (error) throw error;

      toast.success("Lead cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["franchisee-prospects"] });
      onOpenChange(false);
      setFormData({
        name: "",
        contact_info: "",
        city: "",
        status: "Novo",
      });
    } catch (error: any) {
      toast.error("Erro ao cadastrar lead: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Lead Regional</DialogTitle>
          <DialogDescription>
            Cadastre um potencial parceiro ou estabelecimento em sua região.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Estabelecimento / Contato</Label>
            <Input
              id="name"
              placeholder="Ex: Pizzaria do Zé"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact">Telefone / WhatsApp / E-mail</Label>
            <Input
              id="contact"
              placeholder="Ex: (79) 99999-9999"
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Cidade</Label>
            <Select
              value={formData.city}
              onValueChange={(value) => setFormData({ ...formData, city: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Status Inicial</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Novo">Novo</SelectItem>
                <SelectItem value="Em Contato">Em Contato</SelectItem>
                <SelectItem value="Negociação">Negociação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Cadastrar Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
