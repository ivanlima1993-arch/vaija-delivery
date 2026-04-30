import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAddress } from "@/contexts/AddressContext";
import RestaurantCard from "./RestaurantCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Star, Bike, Clock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Establishment {
  id: string;
  name: string;
  cover_url: string | null;
  category: string;
  rating: number | null;
  min_delivery_time: number | null;
  max_delivery_time: number | null;
  delivery_fee: number | null;
  is_open: boolean | null;
}

const RestaurantSection = () => {
  const { selectedCityId, isLoading: isCityLoading } = useAddress();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "Tudo", icon: Zap },
    { id: "top", label: "Melhor Avaliados", icon: Star },
    { id: "free", label: "Entrega Grátis", icon: Bike },
    { id: "fast", label: "Mais Rápidos", icon: Clock },
  ];

  useEffect(() => {
    const fetchEstablishments = async () => {
      setIsLoading(true);

      let query = supabase
        .from("establishments")
        .select("id, name, cover_url, category, rating, min_delivery_time, max_delivery_time, delivery_fee, is_open")
        .eq("is_approved", true);

      // Apply sorting/filtering based on activeFilter
      if (activeFilter === "top") {
        query = query.order("rating", { ascending: false });
      } else if (activeFilter === "fast") {
        query = query.order("min_delivery_time", { ascending: true });
      } else {
        query = query.order("rating", { ascending: false });
      }

      if (selectedCityId) {
        query = query.eq("city_id", selectedCityId);
      }

      const { data, error } = await query;

      if (!error && data) {
        let filteredData = data;
        if (activeFilter === "free") {
          filteredData = data.filter(est => !est.delivery_fee || est.delivery_fee === 0);
        }
        setEstablishments(filteredData.slice(0, 6));
      }
      setIsLoading(false);
    };

    if (!isCityLoading) {
      fetchEstablishments();
    }
  }, [selectedCityId, isCityLoading, activeFilter]);

  const formatDeliveryTime = (min: number | null, max: number | null) => {
    if (!min && !max) return "30-45 min";
    if (!max) return `${min} min`;
    return `${min}-${max} min`;
  };

  const formatDeliveryFee = (fee: number | null) => {
    if (!fee || fee === 0) return "Grátis";
    return `R$ ${fee.toFixed(2).replace(".", ",")}`;
  };

  const mappedRestaurants = establishments.map((est) => ({
    id: est.id,
    name: est.name,
    image: est.cover_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop",
    category: est.category,
    rating: est.rating || 0,
    deliveryTime: formatDeliveryTime(est.min_delivery_time, est.max_delivery_time),
    deliveryFee: formatDeliveryFee(est.delivery_fee),
    isOpen: est.is_open ?? false,
  }));

  return (
    <section className="py-16 bg-[#fafafa]">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] px-3 py-1 uppercase tracking-widest">
              Seleção Premium
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight leading-none">
              Comerciantes em Destaque
            </h2>
            <p className="text-muted-foreground max-w-md">
              Os melhores estabelecimentos e lojistas da sua região.
            </p>
          </div>

          <Link
            to="/restaurantes"
            className="hidden md:flex items-center gap-2 font-black text-sm text-primary group"
          >
            Ver catálogo completo
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 mb-4">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shadow-sm border ${activeFilter === filter.id
                ? "bg-primary text-white border-primary shadow-glow scale-105"
                : "bg-white text-muted-foreground border-border hover:border-primary/50"
                }`}
            >
              <filter.icon className={`w-4 h-4 ${activeFilter === filter.id ? "fill-white" : ""}`} />
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-[28px] overflow-hidden shadow-soft">
                <Skeleton className="aspect-[16/11] w-full" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : mappedRestaurants.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] shadow-soft border border-dashed border-border">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-black mb-2">Ops! Nada por aqui.</h3>
            <p className="text-muted-foreground mb-8">Não encontramos comerciantes com este filtro na sua região.</p>
            <Button variant="outline" onClick={() => setActiveFilter("all")}>Limpar filtros</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {mappedRestaurants.map((restaurant, index) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                index={index}
              />
            ))}
          </div>
        )}

        <div className="mt-12 text-center md:hidden">
          <Link to="/restaurantes">
            <Button className="w-full h-14 rounded-2xl font-black gradient-primary shadow-glow">
              VER TODOS OS COMERCIANTES
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RestaurantSection;
