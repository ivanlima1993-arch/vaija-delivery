import { useState } from "react";
import { CreditCard, Banknote, QrCode, Wallet, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEstablishmentPaymentMethods } from "@/hooks/useEstablishmentPaymentMethods";

const ICON_MAP: Record<string, typeof QrCode> = {
  pix: QrCode,
  credit_card: CreditCard,
  debit_card: CreditCard,
  cash: Banknote,
  wallet: Wallet,
};

interface PaymentMethodSelectorProps {
  establishmentId: string | null;
  selectedPayment: string;
  onSelect: (method: string) => void;
}

const PaymentMethodSelector = ({
  establishmentId,
  selectedPayment,
  onSelect,
}: PaymentMethodSelectorProps) => {
  const { methods, loading } = useEstablishmentPaymentMethods(establishmentId);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl shadow-soft overflow-hidden"
      >
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-bold">Forma de pagamento</h2>
        </div>
        <div className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  if (methods.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl shadow-soft overflow-hidden"
      >
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-bold">Forma de pagamento</h2>
        </div>
        <div className="p-4 text-sm text-muted-foreground text-center">
          Nenhuma forma de pagamento disponível
        </div>
      </motion.div>
    );
  }

  // Auto-select first method if current selection is not available
  const isCurrentValid = methods.some((m) => m.method_key === selectedPayment);
  if (!isCurrentValid && methods.length > 0) {
    // Use setTimeout to avoid state update during render
    setTimeout(() => onSelect(methods[0].method_key), 0);
  }

  const cols = methods.length <= 3 ? `grid-cols-${methods.length}` : "grid-cols-3";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card rounded-xl shadow-soft overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <h2 className="font-display font-bold">Forma de pagamento</h2>
      </div>

      <div className={`p-4 grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.min(methods.length, 3)}, 1fr)` }}>
        {methods.map((method) => {
          const Icon = ICON_MAP[method.method_key] || CreditCard;
          const isOnline = method.method_key === "pix" || method.method_key === "credit_card";
          return (
            <button
              key={method.method_key}
              onClick={() => onSelect(method.method_key)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedPayment === method.method_key
                  ? "border-primary bg-accent"
                  : "border-transparent bg-muted hover:bg-accent/50"
              }`}
            >
              <Icon
                className={`w-6 h-6 mx-auto mb-2 ${
                  selectedPayment === method.method_key
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <p className="text-sm font-medium">{method.method_name}</p>
              <p className="text-[10px] text-muted-foreground">
                {isOnline ? "Pague online" : method.description || ""}
              </p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PaymentMethodSelector;
