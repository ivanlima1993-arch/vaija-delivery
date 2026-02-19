import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LinkDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  onSuccess: () => void;
}

const LinkDriverDialog = ({ open, onOpenChange, establishmentId, onSuccess }: LinkDriverDialogProps) => {
  const [cpf, setCpf] = useState("");
  const [searching, setSearching] = useState(false);
  const [driver, setDriver] = useState<{ user_id: string; full_name: string } | null>(null);
  const [linking, setLinking] = useState(false);

  const handleSearch = async () => {
    if (!cpf) {
      toast.error("Por favor, informe o CPF");
      return;
    }

    setSearching(true);
    setDriver(null);

    try {
      // Clean CPF to only numbers
      const cleanCPF = cpf.replace(/\D/g, "");
      
      // We try to use a RPC function if available, or a direct query if RLS allows
      // For now, let's try direct query. Note: This assumes RLS policy allows searching by CPF
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("cpf_cnpj", cpf) // Try with original format
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Try with clean CPF
        const { data: dataClean, error: errorClean } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .eq("cpf_cnpj", cleanCPF)
          .maybeSingle();

        if (errorClean) throw errorClean;
        
        if (!dataClean) {
          toast.error("Entregador não encontrado com este CPF");
          return;
        }
        setDriver(dataClean);
      } else {
        setDriver(data);
      }
    } catch (error: any) {
      console.error("Error searching driver:", error);
      toast.error("Erro ao buscar entregador");
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async () => {
    if (!driver || !establishmentId) return;

    setLinking(true);
    try {
      // Check if already linked
      const { data: existing } = await supabase
        .from("establishment_drivers")
        .select("id")
        .eq("establishment_id", establishmentId)
        .eq("driver_id", driver.user_id)
        .maybeSingle();

      if (existing) {
        toast.error("Este entregador já está vinculado ao seu estabelecimento");
        return;
      }

      const { error } = await supabase
        .from("establishment_drivers")
        .insert({
          establishment_id: establishmentId,
          driver_id: driver.user_id,
          status: "active"
        });

      if (error) throw error;

      toast.success("Entregador vinculado com sucesso!");
      onSuccess();
      onOpenChange(false);
      setCpf("");
      setDriver(null);
    } catch (error: any) {
      console.error("Error linking driver:", error);
      toast.error("Erro ao vincular entregador. Verifique se a tabela establishment_drivers existe.");
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular Novo Entregador</DialogTitle>
          <DialogDescription>
            Busque um entregador pelo CPF para vinculá-lo ao seu estabelecimento.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF do Entregador</Label>
            <div className="flex gap-2">
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching} variant="secondary">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {driver && (
            <div className="p-4 bg-muted rounded-lg flex items-center justify-between border">
              <div>
                <p className="text-sm font-medium">Entregador encontrado:</p>
                <p className="font-bold">{driver.full_name}</p>
              </div>
              <Button onClick={handleLink} disabled={linking} size="sm">
                {linking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Vincular
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkDriverDialog;
