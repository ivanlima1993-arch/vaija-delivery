import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { UtensilsCrossed, ShoppingCart, Pill, Gift, Coffee, IceCream, Pizza, Sandwich } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RestaurantCard from "@/components/home/RestaurantCard";
import { Link } from "react-router-dom";

const categories = [
  { id: "restaurantes", name: "Restaurantes", icon: UtensilsCrossed, color: "bg-primary/10 text-primary" },
  { id: "mercados", name: "Mercados", icon: ShoppingCart, color: "bg-success/10 text-success" },
  { id: "farmacias", name: "Farmácias", icon: Pill, color: "bg-info/10 text-info" },
  { id: "presentes", name: "Presentes", icon: Gift, color: "bg-warning/10 text-warning" },
  { id: "cafeteria", name: "Cafeteria", icon: Coffee, color: "bg-amber-100 text-amber-600" },
  { id: "sorvetes", name: "Sorvetes", icon: IceCream, color: "bg-pink-100 text-pink-600" },
  { id: "pizzarias", name: "Pizzarias", icon: Pizza, color: "bg-orange-100 text-orange-600" },
  { id: "lanches", name: "Lanches", icon: Sandwich, color: "bg-yellow-100 text-yellow-600" },
];

const restaurantsByCategory: Record<string, any[]> = {
  restaurantes: [
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
      id: 4,
      name: "Cantina do Italiano",
      image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&h=300&fit=crop",
      category: "Massas • Italiana",
      rating: 4.5,
      deliveryTime: "30-40 min",
      deliveryFee: "R$ 4,99",
      isOpen: true,
    },
  ],
  pizzarias: [
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
  ],
  lanches: [
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
  ],
  cafeteria: [
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
  ],
  sorvetes: [
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
  ],
  mercados: [
    {
      id: 9,
      name: "Mercado Express",
      image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500&h=300&fit=crop",
      category: "Mercado • Conveniência",
      rating: 4.3,
      deliveryTime: "30-45 min",
      deliveryFee: "R$ 6,99",
      isOpen: true,
    },
  ],
  farmacias: [
    {
      id: 10,
      name: "Farmácia Saúde Total",
      image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=500&h=300&fit=crop",
      category: "Farmácia • Saúde",
      rating: 4.5,
      deliveryTime: "20-35 min",
      deliveryFee: "R$ 5,99",
      isOpen: true,
    },
  ],
  presentes: [
    {
      id: 11,
      name: "Floricultura Encanto",
      image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=500&h=300&fit=crop",
      category: "Flores • Presentes",
      rating: 4.7,
      deliveryTime: "45-60 min",
      deliveryFee: "R$ 9,99",
      isOpen: true,
    },
  ],
};

const Categories = () => {
  const { slug } = useParams();
  const currentCategory = categories.find((c) => c.id === slug);
  const restaurants = slug ? restaurantsByCategory[slug] || [] : [];

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
            <h1 className="font-display text-2xl font-bold mb-6">Todas as Categorias</h1>
            
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
                <p className="text-muted-foreground">{restaurants.length} estabelecimentos</p>
              </div>
            </div>
          )}

          {restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {restaurants.map((restaurant, index) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Nenhum estabelecimento encontrado nesta categoria</p>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
