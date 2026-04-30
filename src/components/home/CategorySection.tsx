import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { DISPLAY_CATEGORIES } from "@/constants/categories";

// Show first 12 categories on homepage
const categories = DISPLAY_CATEGORIES.slice(0, 12);

const CategorySection = () => {
  return (
    <section className="py-12 bg-white">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-black tracking-tight">O que você busca?</h2>
            <p className="text-muted-foreground mt-1">Navegue pelas melhores opções da sua região</p>
          </div>
          <Link
            to="/categorias"
            className="group flex items-center gap-1 text-sm font-bold text-primary hover:opacity-80 transition-opacity"
          >
            Ver tudo
            <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              →
            </motion.span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link to={`/categorias/${category.id}`}>
                <motion.button
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full h-full flex flex-col items-center gap-3 p-5 rounded-[32px] bg-card border-none shadow-soft hover:shadow-elevated transition-all group"
                >
                  <div className={`w-16 h-16 rounded-3xl ${category.color} flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform group-hover:shadow-glow`}>
                    <category.icon className="w-8 h-8 text-inherit" />
                  </div>
                  <span className="text-sm font-black text-center">{category.name}</span>
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
