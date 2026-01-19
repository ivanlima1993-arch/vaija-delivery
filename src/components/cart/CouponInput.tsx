import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tag, X, Loader2, Check, Percent, Gift } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
}

interface CouponInputProps {
  subtotal: number;
  cityId?: string | null;
  neighborhoodId?: string | null;
  establishmentId?: string | null;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon | null) => void;
}

export const CouponInput = ({
  subtotal,
  cityId,
  neighborhoodId,
  establishmentId,
  appliedCoupon,
  onApplyCoupon,
}: CouponInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const validateCoupon = async () => {
    if (!code.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }

    setLoading(true);
    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast.error("Cupom inválido ou expirado");
        return;
      }

      // Check if coupon is still valid
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        toast.error("Este cupom expirou");
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        toast.error("Este cupom atingiu o limite de uso");
        return;
      }

      // Check minimum order value
      if (coupon.min_order_value && subtotal < Number(coupon.min_order_value)) {
        toast.error(
          `Pedido mínimo de R$ ${Number(coupon.min_order_value).toFixed(2)} para usar este cupom`
        );
        return;
      }

      // Check regional restrictions
      if (coupon.city_id && coupon.city_id !== cityId) {
        toast.error("Este cupom não é válido para sua região");
        return;
      }

      if (coupon.neighborhood_id && coupon.neighborhood_id !== neighborhoodId) {
        toast.error("Este cupom não é válido para seu bairro");
        return;
      }

      // Check establishment restriction
      if (coupon.establishment_id && coupon.establishment_id !== establishmentId) {
        toast.error("Este cupom não é válido para este estabelecimento");
        return;
      }

      onApplyCoupon(coupon as Coupon);
      toast.success("Cupom aplicado com sucesso! 🎉");
      setCode("");
      setIsExpanded(false);
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast.error("Erro ao validar cupom");
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    onApplyCoupon(null);
    toast.info("Cupom removido");
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discount_type === "percentage") {
      const discount = (subtotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount) {
        return Math.min(discount, appliedCoupon.max_discount);
      }
      return discount;
    }
    
    return Math.min(appliedCoupon.discount_value, subtotal);
  };

  if (appliedCoupon) {
    const discount = calculateDiscount();
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-success/10 border border-success/30 rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-semibold text-success flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {appliedCoupon.code}
              </p>
              <p className="text-sm text-muted-foreground">
                {appliedCoupon.discount_type === "percentage" 
                  ? `${appliedCoupon.discount_value}% de desconto`
                  : `R$ ${Number(appliedCoupon.discount_value).toFixed(2)} de desconto`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-success">
              -R$ {discount.toFixed(2).replace(".", ",")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={removeCoupon}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-soft overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <span className="font-medium">Adicionar cupom de desconto</span>
        </div>
        <Tag className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 flex gap-2">
              <Input
                placeholder="Digite o código do cupom"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                className="uppercase"
              />
              <Button 
                onClick={validateCoupon} 
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Aplicar"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const calculateCouponDiscount = (
  coupon: Coupon | null,
  subtotal: number
): number => {
  if (!coupon) return 0;
  
  if (coupon.discount_type === "percentage") {
    const discount = (subtotal * coupon.discount_value) / 100;
    if (coupon.max_discount) {
      return Math.min(discount, Number(coupon.max_discount));
    }
    return discount;
  }
  
  return Math.min(Number(coupon.discount_value), subtotal);
};
