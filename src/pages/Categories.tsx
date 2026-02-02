import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RestaurantCard from "@/components/home/RestaurantCard";
import { supabase } from "@/integrations/supabase/client";
import { useAddress } from "@/contexts/AddressContext";
import { Skeleton } from "@/components/ui/skeleton";
import { DISPLAY_CATEGORIES } from "@/constants/categories";

const categories = DISPLAY_CATEGORIES;

const Categories = () => {
  const { slug } = useParams();
  const { selectedCityId, selectedCityName } = useAddress();
  const currentCategory = categories.find((c) => c.id === slug);

  const { data: establishments = [], isLoading } = useQuery({
    queryKey: ["establishments-by-category", slug, selectedCityId],
    queryFn: async () => {
      let query = supabase
        .from("establishments")
        .select("*")
        .eq("is_approved", true);

      if (slug) {
        query = query.eq("category", slug);
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

  const mapEstablishmentToRestaurant = (establishment: any) => ({
    id: establishment.id,
    name: establishment.name,
    image: establishment.cover_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop",
    category: establishment.category,
    rating: establishment.rating || 0,
    deliveryTime: `${establishment.min_delivery_time || 30}-${establishment.max_delivery_time || 60} min`,
    deliveryFee: establishment.delivery_fee === 0 ? "Grátis" : `R$ ${establishment.delivery_fee?.toFixed(2).replace(".", ",")}`,
    isOpen: establishment.is_open || false,
  });

  // Se não tiver slug, mostrar todas as categorias
  if (!slug) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-2xl font-bold mb-2">Todas as Categorias</h1>
            {selectedCityName && (
              <p className="text-muted-foreground mb-6">em {selectedCityName}</p>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/categorias/${category.id}`}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card shadow-soft hover:shadow-card transition-all hover:-translate-y-1"
                  >
                    <div className={`w-16 h-16 rounded-xl ${category.color} flex items-center justify-center`}>
                      <category.icon className="w-8 h-8" />
                    </div>
                    <span className="font-medium text-center">{category.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {currentCategory && (
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-xl ${currentCategory.color} flex items-center justify-center`}>
                <currentCategory.icon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">{currentCategory.name}</h1>
                <p className="text-muted-foreground">
                  {isLoading ? "Carregando..." : `${establishments.length} estabelecimentos`}
                  {selectedCityName && ` em ${selectedCityName}`}
                </p>
              </div>
            </div>
          )}

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
          ) : establishments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {establishments.map((establishment, index) => (
                <RestaurantCard
                  key={establishment.id}
                  restaurant={mapEstablishmentToRestaurant(establishment)}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                Nenhum estabelecimento encontrado nesta categoria
                {selectedCityName && ` em ${selectedCityName}`}
              </p>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;