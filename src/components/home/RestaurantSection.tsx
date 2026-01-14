import { Link } from "react-router-dom";
import RestaurantCard from "./RestaurantCard";

const restaurants = [
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
];

const RestaurantSection = () => {
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
          {restaurants.map((restaurant, index) => (
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
