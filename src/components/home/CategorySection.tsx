import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { DISPLAY_CATEGORIES } from "@/constants/categories";

// Show first 8 categories on homepage
const categories = DISPLAY_CATEGORIES.slice(0, 8);

const CategorySection = () => {
  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Categorias</h2>
          <Link to="/categorias" className="text-sm font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link to={`/categorias/${category.id}`}>
                <motion.button
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-card shadow-soft hover:shadow-card transition-all"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${category.color} flex items-center justify-center`}>
                    <category.icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-center">{category.name}</span>
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
