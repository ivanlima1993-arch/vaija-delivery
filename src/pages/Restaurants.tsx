import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RestaurantCard from "@/components/home/RestaurantCard";
import { supabase } from "@/integrations/supabase/client";
import { useAddress } from "@/contexts/AddressContext";
import { Skeleton } from "@/components/ui/skeleton";
import FilterBar, { type FilterOptions } from "@/components/home/FilterBar";

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

const Restaurants = () => {
  const { selectedCityId, selectedCityName, isLoading: isCityLoading } = useAddress();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    freeDelivery: false,
    bestRated: false,
    fastDelivery: false,
    priceRange: null,
  });

  useEffect(() => {
    const fetchEstablishments = async () => {
      setIsLoading(true);
      
      let query = supabase
        .from("establishments")
        .select("id, name, cover_url, category, rating, min_delivery_time, max_delivery_time, delivery_fee, is_open")
        .eq("is_approved", true)
        .order("rating", { ascending: false });

      if (selectedCityId) {
        query = query.eq("city_id", selectedCityId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setEstablishments(data);
      }
      setIsLoading(false);
    };

    if (!isCityLoading) {
      fetchEstablishments();
    }
  }, [selectedCityId, isCityLoading]);

  const formatDeliveryTime = (min: number | null, max: number | null) => {
    if (!min && !max) return "30-45 min";
    if (!max) return `${min} min`;
    return `${min}-${max} min`;
  };

  const formatDeliveryFee = (fee: number | null) => {
    if (!fee || fee === 0) return "Grátis";
    return `R$ ${fee.toFixed(2).replace(".", ",")}`;
  };

  const filteredRestaurants = establishments
    .filter((est) => {
      if (filters.freeDelivery && Number(est.delivery_fee) > 0) return false;
      if (filters.bestRated && (est.rating || 0) < 4.5) return false;
      if (filters.fastDelivery && (est.max_delivery_time || 45) > 30) return false;
      // Price range logic could be added here if establishment has price_level field
      return true;
    })
    .map((est) => ({
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold">Todos os Restaurantes</h1>
            <p className="text-muted-foreground">
              {isLoading || isCityLoading 
                ? "Carregando..." 
                : `${filteredRestaurants.length} estabelecimentos disponíveis${selectedCityName ? ` em ${selectedCityName}` : ""}`
              }
            </p>
          </div>

          <FilterBar filters={filters} onChange={setFilters} />

          {isLoading || isCityLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum restaurante encontrado com estes filtros na sua cidade.</p>
              <Button 
                variant="link" 
                onClick={() => setFilters({ freeDelivery: false, bestRated: false, fastDelivery: false, priceRange: null })}
              >
                Limpar todos os filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredRestaurants.map((restaurant, index) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  index={index}
                />
              ))}
            </div>
          )
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Restaurants;
