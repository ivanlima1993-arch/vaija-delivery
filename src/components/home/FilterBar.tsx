import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Bike, DollarSign, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface FilterOptions {
  freeDelivery: boolean;
  bestRated: boolean;
  fastDelivery: boolean;
  priceRange: string | null;
}

interface FilterBarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

const FilterBar = ({ filters, onChange }: FilterBarProps) => {
  const toggleFilter = (key: keyof FilterOptions) => {
    if (typeof filters[key] === "boolean") {
      onChange({ ...filters, [key]: !filters[key] });
    }
  };

  const activeCount = Object.values(filters).filter(v => v === true || v !== null).length;

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={filters.freeDelivery ? "default" : "outline"}
          size="sm"
          onClick={() => toggleFilter("freeDelivery")}
          className="rounded-full gap-2 whitespace-nowrap"
        >
          <Bike className="w-4 h-4" />
          Entrega Grátis
        </Button>
        
        <Button
          variant={filters.bestRated ? "default" : "outline"}
          size="sm"
          onClick={() => toggleFilter("bestRated")}
          className="rounded-full gap-2 whitespace-nowrap"
        >
          <Star className="w-4 h-4" />
          Melhores Avaliados
        </Button>

        <Button
          variant={filters.fastDelivery ? "default" : "outline"}
          size="sm"
          onClick={() => toggleFilter("fastDelivery")}
          className="rounded-full gap-2 whitespace-nowrap"
        >
          <Clock className="w-4 h-4" />
          Entrega Rápida
        </Button>

        <div className="flex items-center gap-1 ml-2">
          {["$", "$$", "$$$"].map((price) => (
            <Button
              key={price}
              variant={filters.priceRange === price ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...filters, priceRange: filters.priceRange === price ? null : price })}
              className="rounded-full min-w-[40px] px-2"
            >
              {price}
            </Button>
          ))}
        </div>

        <AnimatePresence>
          {activeCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ freeDelivery: false, bestRated: false, fastDelivery: false, priceRange: null })}
                className="rounded-full gap-1 text-muted-foreground"
              >
                <X className="w-4 h-4" />
                Limpar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FilterBar;
