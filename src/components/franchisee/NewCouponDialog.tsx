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

interface NewCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cities: any[];
}

export const NewCouponDialog = ({ open, onOpenChange, cities }: NewCouponDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "0",
    city_id: "",
    usage_limit: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city_id) {
      toast.error("Selecione uma cidade");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("coupons").insert({
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_order_value: Number(formData.min_order_value),
        city_id: formData.city_id,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Cupom criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["franchisee-coupons"] });
      onOpenChange(false);
      setFormData({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        min_order_value: "0",
        city_id: "",
        usage_limit: "",
      });
    } catch (error: any) {
      toast.error("Erro ao criar cupom: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Cupom Regional</DialogTitle>
          <DialogDescription>
            Crie um cupom de desconto para incentivar as vendas em sua região.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Código do Cupom</Label>
            <Input
              id="code"
              placeholder="Ex: VAIJA10"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: 10% de desconto na primeira compra"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo de Desconto</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                type="number"
                placeholder="10"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="min">Mín. Pedido</Label>
              <Input
                id="min"
                type="number"
                placeholder="20"
                value={formData.min_order_value}
                onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="limit">Limite de Uso</Label>
              <Input
                id="limit"
                type="number"
                placeholder="Opcional"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Cidade</Label>
            <Select
              value={formData.city_id}
              onValueChange={(value) => setFormData({ ...formData, city_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Cupom
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
