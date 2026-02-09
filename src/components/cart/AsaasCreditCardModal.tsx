import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard } from "lucide-react";

interface AsaasCreditCardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (cardData: CardData) => void;
  isProcessing: boolean;
}

export interface CardData {
  cardHolder: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  cpfCnpj: string;
  phone: string;
  postalCode: string;
  addressNumber: string;
}

const AsaasCreditCardModal = ({ open, onClose, onSubmit, isProcessing }: AsaasCreditCardModalProps) => {
  const [form, setForm] = useState<CardData>({
    cardHolder: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
    cpfCnpj: "",
    phone: "",
    postalCode: "",
    addressNumber: "",
  });

  const update = (field: keyof CardData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pagamento com Cartão
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome no cartão</Label>
            <Input
              value={form.cardHolder}
              onChange={(e) => update("cardHolder", e.target.value)}
              placeholder="Nome como no cartão"
              required
            />
          </div>

          <div>
            <Label>Número do cartão</Label>
            <Input
              value={form.cardNumber}
              onChange={(e) => update("cardNumber", e.target.value.replace(/\D/g, ""))}
              placeholder="0000 0000 0000 0000"
              maxLength={16}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Mês</Label>
              <Input
                value={form.expiryMonth}
                onChange={(e) => update("expiryMonth", e.target.value.replace(/\D/g, ""))}
                placeholder="MM"
                maxLength={2}
                required
              />
            </div>
            <div>
              <Label>Ano</Label>
              <Input
                value={form.expiryYear}
                onChange={(e) => update("expiryYear", e.target.value.replace(/\D/g, ""))}
                placeholder="AAAA"
                maxLength={4}
                required
              />
            </div>
            <div>
              <Label>CVV</Label>
              <Input
                value={form.ccv}
                onChange={(e) => update("ccv", e.target.value.replace(/\D/g, ""))}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div>
            <Label>CPF/CNPJ do titular</Label>
            <Input
              value={form.cpfCnpj}
              onChange={(e) => update("cpfCnpj", e.target.value.replace(/\D/g, ""))}
              placeholder="000.000.000-00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                value={form.postalCode}
                onChange={(e) => update("postalCode", e.target.value.replace(/\D/g, ""))}
                placeholder="00000-000"
                maxLength={8}
                required
              />
            </div>
          </div>

          <div>
            <Label>Número do endereço</Label>
            <Input
              value={form.addressNumber}
              onChange={(e) => update("addressNumber", e.target.value)}
              placeholder="123"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              "Pagar com cartão"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AsaasCreditCardModal;
