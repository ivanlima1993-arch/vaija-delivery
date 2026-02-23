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
          className="group relative bg-white rounded-[28px] overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-500 border border-transparent hover:border-orange-100"
        >
          {/* Image Container */}
          <div className="relative aspect-[16/11] overflow-hidden">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />

            {/* Top Badges */}
            <div className="absolute top-3 inset-x-3 flex justify-between items-start">
              {restaurant.isOpen ? (
                <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black text-success uppercase border border-white/50 shadow-sm">
                  Aberto
                </div>
              ) : (
                <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[10px] font-black text-white uppercase border border-white/10 shadow-sm">
                  Fechado
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-white/50">
                  <Star className="w-3 h-3 fill-warning text-warning" />
                  <span className="text-[11px] font-black">{restaurant.rating.toFixed(1)}</span>
                </div>
                {restaurant.discount && (
                  <div className="px-2 py-1 gradient-primary rounded-xl text-[10px] font-black text-white shadow-glow">
                    {restaurant.discount}
                  </div>
                )}
              </div>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Details */}
          <div className="p-5">
            <div className="flex flex-col gap-1 mb-3">
              <h3 className="font-display font-black text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {restaurant.name}
              </h3>
              <p className="text-[11px] uppercase font-black tracking-widest text-muted-foreground/60">
                {restaurant.category}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-between p-3 bg-muted/30 rounded-2xl group-hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">{restaurant.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                    <Bike className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-[11px] font-black text-green-600">{restaurant.deliveryFee}</span>
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
