import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AsaasPixModalProps {
  open: boolean;
  onClose: () => void;
  pixData: {
    paymentId: string;
    pixQrCode: string;
    pixCopyPaste: string;
  } | null;
  onPaymentConfirmed: () => void;
}

const AsaasPixModal = ({ open, onClose, pixData, onPaymentConfirmed }: AsaasPixModalProps) => {
  const [status, setStatus] = useState<"waiting" | "confirmed" | "failed">("waiting");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open || !pixData) return;
    setStatus("waiting");

    const interval = setInterval(async () => {
      setChecking(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke("asaas-payment", {
          body: { action: "check_status", paymentId: pixData.paymentId },
        });

        if (res.data?.status === "RECEIVED" || res.data?.status === "CONFIRMED") {
          setStatus("confirmed");
          clearInterval(interval);
          setTimeout(() => onPaymentConfirmed(), 2000);
        } else if (res.data?.status === "OVERDUE" || res.data?.status === "REFUNDED") {
          setStatus("failed");
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Error checking payment status:", e);
      }
      setChecking(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [open, pixData]);

  const copyToClipboard = () => {
    if (pixData?.pixCopyPaste) {
      navigator.clipboard.writeText(pixData.pixCopyPaste);
      toast.success("Código PIX copiado!");
    }
  };

  if (!pixData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Pagamento via PIX</DialogTitle>
        </DialogHeader>

        {status === "waiting" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-48 h-48 bg-white rounded-lg p-2">
              <img
                src={`data:image/png;base64,${pixData.pixQrCode}`}
                alt="QR Code PIX"
                className="w-full h-full"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code ou copie o código para pagar
            </p>
            <Button variant="outline" className="w-full" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar código PIX
            </Button>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Aguardando pagamento...
            </div>
          </div>
        )}

        {status === "confirmed" && (
          <div className="text-center space-y-4 py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <p className="font-semibold text-lg">Pagamento confirmado!</p>
            <p className="text-sm text-muted-foreground">Redirecionando...</p>
          </div>
        )}

        {status === "failed" && (
          <div className="text-center space-y-4 py-6">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <p className="font-semibold text-lg">Pagamento expirado</p>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AsaasPixModal;
