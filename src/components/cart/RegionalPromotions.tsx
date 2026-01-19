import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Percent, Truck, Gift } from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_type: "percentage" | "fixed" | "free_delivery";
  discount_value: number;
  banner_url: string | null;
  min_order_value: number | null;
}

interface RegionalPromotionsProps {
  cityId?: string | null;
  neighborhoodId?: string | null;
  establishmentId?: string | null;
  subtotal: number;
  onPromotionApply?: (promotion: Promotion | null) => void;
}

export const RegionalPromotions = ({
  cityId,
  neighborhoodId,
  establishmentId,
  subtotal,
  onPromotionApply,
}: RegionalPromotionsProps) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, [cityId, neighborhoodId, establishmentId]);

  const fetchPromotions = async () => {
    try {
      let query = supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true);

      const { data, error } = await query;

      if (error) throw error;

      // Filter promotions based on location
      const filteredPromotions = (data || []).filter((promo) => {
        // Global promotions (no restrictions)
        if (!promo.city_id && !promo.neighborhood_id && !promo.establishment_id) {
          return true;
        }
        
        // City-specific
        if (promo.city_id && promo.city_id === cityId) {
          return true;
        }
        
        // Neighborhood-specific
        if (promo.neighborhood_id && promo.neighborhood_id === neighborhoodId) {
          return true;
        }
        
        // Establishment-specific
        if (promo.establishment_id && promo.establishment_id === establishmentId) {
          return true;
        }
        
        return false;
      });

      setPromotions(filteredPromotions as Promotion[]);

      // Auto-apply the best applicable promotion
      const applicablePromo = filteredPromotions.find(
        (p) => !p.min_order_value || subtotal >= Number(p.min_order_value)
      );
      onPromotionApply?.(applicablePromo as Promotion || null);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || promotions.length === 0) return null;

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case "free_delivery":
        return <Truck className="w-4 h-4" />;
      case "percentage":
        return <Percent className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getPromotionLabel = (promo: Promotion) => {
    switch (promo.discount_type) {
      case "free_delivery":
        return "Entrega Grátis";
      case "percentage":
        return `${promo.discount_value}% OFF`;
      case "fixed":
        return `R$ ${Number(promo.discount_value).toFixed(2)} OFF`;
      default:
        return promo.title;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <p className="text-sm font-medium text-muted-foreground">Promoções disponíveis</p>
      <div className="flex flex-wrap gap-2">
        {promotions.map((promo) => {
          const isApplicable = !promo.min_order_value || subtotal >= Number(promo.min_order_value);
          
          return (
            <Badge
              key={promo.id}
              variant={isApplicable ? "default" : "outline"}
              className={`gap-1.5 py-1.5 px-3 ${
                isApplicable 
                  ? "bg-success/10 text-success border-success/30 hover:bg-success/20" 
                  : "opacity-60"
              }`}
            >
              {getPromotionIcon(promo.discount_type)}
              <span>{getPromotionLabel(promo)}</span>
              {!isApplicable && promo.min_order_value && (
                <span className="text-xs ml-1">
                  (min R$ {Number(promo.min_order_value).toFixed(0)})
                </span>
              )}
            </Badge>
          );
        })}
      </div>
    </motion.div>
  );
};
