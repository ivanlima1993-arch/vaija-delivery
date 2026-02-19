import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RestaurantCard from "@/components/home/RestaurantCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAddress } from "@/contexts/AddressContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(initialQuery);
  const { selectedCityId } = useAddress();

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ["search-restaurants", initialQuery, selectedCityId],
    queryFn: async () => {
      if (!initialQuery && !selectedCityId) return [];

      let query = supabase
        .from("establishments")
        .select("*")
        .eq("is_approved", true);

      if (initialQuery) {
        query = query.or(`name.ilike.%${initialQuery}%,category.ilike.%${initialQuery}%`);
      }

      if (selectedCityId) {
        query = query.eq("city_id", selectedCityId);
      }

      const { data, error } = await query.order("rating", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });

  const mapEstablishmentToRestaurant = (est: any) => ({
    id: est.id,
    name: est.name,
    image: est.cover_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop",
    category: est.category,
    rating: est.rating || 0,
    deliveryTime: `${est.min_delivery_time || 30}-${est.max_delivery_time || 60} min`,
    deliveryFee: est.delivery_fee === 0 ? "Grátis" : `R$ ${est.delivery_fee?.toFixed(2).replace(".", ",")}`,
    isOpen: est.is_open || false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(inputValue ? { q: inputValue } : {});
  };

  const clearSearch = () => {
    setInputValue("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-2xl font-bold mb-4">
            {initialQuery ? `Resultados para "${initialQuery}"` : "Buscar"}
          </h1>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Buscar restaurantes, pratos..."
                className="w-full h-12 pl-12 pr-10 rounded-xl bg-card border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button type="submit" variant="default" size="lg">
              Buscar
            </Button>
            <Button type="button" variant="outline" size="lg">
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </form>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card">
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {restaurants.map((establishment, index) => (
              <RestaurantCard
                key={establishment.id}
                restaurant={mapEstablishmentToRestaurant(establishment)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <SearchIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum resultado encontrado</h2>
            <p className="text-muted-foreground">
              Tente buscar por outro termo ou explore nossas categorias
            </p>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Search;
