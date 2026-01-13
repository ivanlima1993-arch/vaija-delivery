import { motion } from "framer-motion";
import { UtensilsCrossed, ShoppingCart, Pill, Gift, Coffee, IceCream, Pizza, Sandwich } from "lucide-react";

const categories = [
  { id: 1, name: "Restaurantes", icon: UtensilsCrossed, color: "bg-primary/10 text-primary" },
  { id: 2, name: "Mercados", icon: ShoppingCart, color: "bg-success/10 text-success" },
  { id: 3, name: "Farmácias", icon: Pill, color: "bg-info/10 text-info" },
  { id: 4, name: "Presentes", icon: Gift, color: "bg-warning/10 text-warning" },
  { id: 5, name: "Cafeteria", icon: Coffee, color: "bg-amber-100 text-amber-600" },
  { id: 6, name: "Sorvetes", icon: IceCream, color: "bg-pink-100 text-pink-600" },
  { id: 7, name: "Pizzarias", icon: Pizza, color: "bg-orange-100 text-orange-600" },
  { id: 8, name: "Lanches", icon: Sandwich, color: "bg-yellow-100 text-yellow-600" },
];

const CategorySection = () => {
  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Categorias</h2>
          <button className="text-sm font-medium text-primary hover:underline">
            Ver todas
          </button>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-card shadow-soft hover:shadow-card transition-all"
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${category.color} flex items-center justify-center`}>
                <category.icon className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <span className="text-xs md:text-sm font-medium text-center">{category.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
