import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RestaurantCard from "@/components/home/RestaurantCard";
import { Button } from "@/components/ui/button";

const allRestaurants = [
  {
    id: 1,
    name: "Burger House Premium",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=300&fit=crop",
    category: "Hambúrgueres • Lanches",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: "R$ 5,99",
    isOpen: true,
    discount: "20% OFF",
  },
  {
    id: 2,
    name: "Pizzaria Bella Napoli",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=300&fit=crop",
    category: "Pizzas • Italiana",
    rating: 4.6,
    deliveryTime: "40-50 min",
    deliveryFee: "Grátis",
    isOpen: true,
  },
  {
    id: 3,
    name: "Sushi Master",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&h=300&fit=crop",
    category: "Japonesa • Sushi",
    rating: 4.9,
    deliveryTime: "35-45 min",
    deliveryFee: "R$ 7,99",
    isOpen: true,
    discount: "Frete Grátis",
  },
  {
    id: 4,
    name: "Cantina do Italiano",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&h=300&fit=crop",
    category: "Massas • Italiana",
    rating: 4.5,
    deliveryTime: "30-40 min",
    deliveryFee: "R$ 4,99",
    isOpen: true,
  },
  {
    id: 5,
    name: "Açaí da Terra",
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=500&h=300&fit=crop",
    category: "Açaí • Saudável",
    rating: 4.7,
    deliveryTime: "20-30 min",
    deliveryFee: "R$ 3,99",
    isOpen: true,
  },
  {
    id: 6,
    name: "Churrascaria Fogo de Chão",
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=500&h=300&fit=crop",
    category: "Carnes • Churrasco",
    rating: 4.4,
    deliveryTime: "45-55 min",
    deliveryFee: "R$ 8,99",
    isOpen: false,
  },
  {
    id: 7,
    name: "Café Colonial",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=300&fit=crop",
    category: "Cafeteria • Doces",
    rating: 4.6,
    deliveryTime: "15-25 min",
    deliveryFee: "R$ 4,99",
    isOpen: true,
  },
  {
    id: 8,
    name: "Sorveteria Gelatto",
    image: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&h=300&fit=crop",
    category: "Sorvetes • Sobremesas",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: "R$ 5,99",
    isOpen: true,
  },
];

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery) return allRestaurants;
    const query = searchQuery.toLowerCase();
    return allRestaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputValue);
    setSearchParams(inputValue ? { q: inputValue } : {});
  };

  const clearSearch = () => {
    setInputValue("");
    setSearchQuery("");
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
            {searchQuery ? `Resultados para "${searchQuery}"` : "Buscar"}
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

        {filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredRestaurants.map((restaurant, index) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
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
