import { motion } from "framer-motion";
import { Star, Clock, Bike } from "lucide-react";
import { Link } from "react-router-dom";

interface Restaurant {
  id: number | string;
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/restaurant/${restaurant.id}`}>
        <motion.div
          whileHover={{ y: -6 }}
          className="group relative bg-white rounded-2xl sm:rounded-[28px] overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-500 border border-transparent hover:border-orange-100"
        >
          {/* Image Container */}
          <div className="relative aspect-[16/11] overflow-hidden">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />

            {/* Top Badges */}
            <div className="absolute top-2 inset-x-2 sm:top-3 sm:inset-x-3 flex justify-between items-start">
              {restaurant.isOpen ? (
                <div className="px-1.5 py-0.5 sm:px-3 sm:py-1 bg-white/90 backdrop-blur-sm rounded-full text-[8px] sm:text-[10px] font-black text-success uppercase border border-white/50 shadow-sm">
                  Aberto
                </div>
              ) : (
                <div className="px-1.5 py-0.5 sm:px-3 sm:py-1 bg-black/60 backdrop-blur-sm rounded-full text-[8px] sm:text-[10px] font-black text-white uppercase border border-white/10 shadow-sm">
                  Fechado
                </div>
              )}

              <div className="flex flex-col gap-1 sm:gap-2">
                <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/95 backdrop-blur-md rounded-lg sm:rounded-xl shadow-sm border border-white/50">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-warning text-warning" />
                  <span className="text-[9px] sm:text-[11px] font-black">{restaurant.rating.toFixed(1)}</span>
                </div>
                {restaurant.discount && (
                  <div className="px-1.5 py-0.5 sm:px-2 sm:py-1 gradient-primary rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black text-white shadow-glow">
                    {restaurant.discount}
                  </div>
                )}
              </div>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Details */}
          <div className="p-3 sm:p-5">
            <div className="flex flex-col gap-0.5 sm:gap-1 mb-2 sm:mb-3">
              <h3 className="font-display font-black text-sm sm:text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {restaurant.name}
              </h3>
              <p className="text-[9px] sm:text-[11px] uppercase font-black tracking-widest text-muted-foreground/60">
                {restaurant.category}
              </p>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between p-1.5 sm:p-3 bg-muted/30 rounded-xl sm:rounded-2xl gap-1 sm:gap-2 group-hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 rounded bg-orange-100 flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600" />
                  </div>
                  <span className="text-[9px] sm:text-[11px] font-bold text-muted-foreground whitespace-nowrap">{restaurant.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 rounded bg-green-100 flex items-center justify-center shrink-0">
                    <Bike className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
                  </div>
                  <span className="text-[9px] sm:text-[11px] font-black text-green-600 whitespace-nowrap">{restaurant.deliveryFee}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default RestaurantCard;
