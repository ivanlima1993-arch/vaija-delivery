import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAddress } from "@/contexts/AddressContext";
import RestaurantCard from "./RestaurantCard";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    const fetchEstablishments = async () => {
      setIsLoading(true);
      
      let query = supabase
        .from("establishments")
        .select("id, name, cover_url, category, rating, min_delivery_time, max_delivery_time, delivery_fee, is_open")
        .eq("is_approved", true)
        .order("rating", { ascending: false })
        .limit(6);

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

  if (isLoading || isCityLoading) {
    return (
      <section className="py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold">Restaurantes</h2>
              <p className="text-sm text-muted-foreground">Os melhores da região</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        </div>
      </section>
    );
  }

  if (mappedRestaurants.length === 0) {
    return (
      <section className="py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold">Restaurantes</h2>
              <p className="text-sm text-muted-foreground">Os melhores da região</p>
            </div>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum restaurante encontrado na sua cidade.</p>
            <p className="text-sm text-muted-foreground mt-1">Selecione outra cidade para ver mais opções.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-bold">Restaurantes</h2>
            <p className="text-sm text-muted-foreground">Os melhores da região</p>
          </div>
          <Link to="/restaurantes" className="text-sm font-medium text-primary hover:underline">
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {mappedRestaurants.map((restaurant, index) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RestaurantSection;
