import { motion } from "framer-motion";
import { Percent, Truck, Clock } from "lucide-react";

const promos = [
  {
    id: 1,
    title: "Primeira entrega grátis",
    description: "Em pedidos acima de R$ 30",
    icon: Truck,
    gradient: "from-primary to-orange-500",
  },
  {
    id: 2,
    title: "20% OFF",
    description: "Em restaurantes selecionados",
    icon: Percent,
    gradient: "from-success to-emerald-500",
  },
  {
    id: 3,
    title: "Happy Hour",
    description: "Das 14h às 17h",
    icon: Clock,
    gradient: "from-info to-blue-500",
  },
];

const PromoSection = () => {
  return (
    <section className="py-8 overflow-hidden">
      <div className="container">
        <h2 className="font-display text-xl font-bold mb-6">Promoções</h2>

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 scrollbar-hide">
          {promos.map((promo, index) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`min-w-[280px] md:min-w-0 p-5 rounded-2xl bg-gradient-to-br ${promo.gradient} text-white cursor-pointer shadow-elevated`}
            >
              <promo.icon className="w-10 h-10 mb-4 opacity-90" />
              <h3 className="font-display font-bold text-lg mb-1">{promo.title}</h3>
              <p className="text-sm opacity-90">{promo.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
