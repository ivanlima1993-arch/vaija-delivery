import { motion } from "framer-motion";
import { Star, Clock, Bike } from "lucide-react";
import { Link } from "react-router-dom";

interface Restaurant {
  id: number;
  name: string;
  image: string;
  category: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  isOpen: boolean;
  discount?: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  index: number;
}

const RestaurantCard = ({ restaurant, index }: RestaurantCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/restaurant/${restaurant.id}`}>
        <motion.div
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          className="group relative bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300"
        >
          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Discount Badge */}
            {restaurant.discount && (
              <div className="absolute top-3 left-3 px-3 py-1 gradient-primary rounded-full text-xs font-bold text-primary-foreground shadow-glow">
                {restaurant.discount}
              </div>
            )}

            {/* Closed Overlay */}
            {!restaurant.isOpen && (
              <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                <span className="px-4 py-2 bg-card rounded-full text-sm font-semibold">
                  Fechado
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-display font-semibold text-lg leading-tight line-clamp-1">
                {restaurant.name}
              </h3>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="text-sm font-semibold">{restaurant.rating}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{restaurant.category}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{restaurant.deliveryTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bike className="w-4 h-4" />
                <span className="text-success font-medium">{restaurant.deliveryFee}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default RestaurantCard;
