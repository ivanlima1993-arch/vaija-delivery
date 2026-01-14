import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RestaurantCard from "@/components/home/RestaurantCard";

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
  {
    id: 9,
    name: "Tacos El Mexicano",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=300&fit=crop",
    category: "Mexicana • Tacos",
    rating: 4.5,
    deliveryTime: "25-35 min",
    deliveryFee: "R$ 6,99",
    isOpen: true,
  },
  {
    id: 10,
    name: "Padaria Pão Quente",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=300&fit=crop",
    category: "Padaria • Café",
    rating: 4.7,
    deliveryTime: "15-25 min",
    deliveryFee: "R$ 3,99",
    isOpen: true,
  },
  {
    id: 11,
    name: "Wok Oriental",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=300&fit=crop",
    category: "Chinesa • Tailandesa",
    rating: 4.4,
    deliveryTime: "30-45 min",
    deliveryFee: "R$ 7,99",
    isOpen: true,
  },
  {
    id: 12,
    name: "Espetinho do Zé",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=300&fit=crop",
    category: "Espetinhos • Petiscos",
    rating: 4.3,
    deliveryTime: "20-30 min",
    deliveryFee: "R$ 4,99",
    isOpen: true,
    discount: "10% OFF",
  },
];

const Restaurants = () => {
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
            <p className="text-muted-foreground">{allRestaurants.length} estabelecimentos disponíveis</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {allRestaurants.map((restaurant, index) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Restaurants;
