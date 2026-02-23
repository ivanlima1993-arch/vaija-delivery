import { motion } from "framer-motion";
import { Truck, Percent, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const promos = [
  {
    id: 1,
    title: "Entrega Grátis",
    highlight: "Primeiro Pedido",
    description: "Em pedidos acima de R$ 35",
    icon: Truck,
    gradient: "from-orange-500 to-primary",
    pattern: "bg-orange-400/20",
  },
  {
    id: 2,
    title: "Cupom VAIJA20",
    highlight: "20% DE DESCONTO",
    description: "Válido para restaurantes selecionados",
    icon: Percent,
    gradient: "from-emerald-500 to-green-600",
    pattern: "bg-emerald-400/20",
  },
  {
    id: 3,
    title: "Clube de Vantagens",
    highlight: "CASHBACK REAL",
    description: "Receba até 10% de volta no saldo",
    icon: Wallet,
    gradient: "from-blue-500 to-info",
    pattern: "bg-blue-400/20",
  },
];

const PromoSection = () => {
  return (
    <section className="py-12 overflow-hidden bg-[#fafafa]">
      <div className="container">
        <div className="mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-black tracking-tight">Especial para você</h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Aproveite as melhores ofertas do dia</p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:grid md:grid-cols-3 md:mx-0 md:px-0">
          {promos.map((promo, index) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`relative min-w-[300px] md:min-w-0 h-[180px] p-6 rounded-[32px] bg-gradient-to-br ${promo.gradient} text-white cursor-pointer shadow-elevated overflow-hidden group`}
            >
              {/* Background Pattern */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 ${promo.pattern}`} />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                    <promo.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md px-3 py-1 font-black text-[10px] tracking-widest uppercase">
                    LIMITADO
                  </Badge>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">{promo.title}</p>
                  <h3 className="font-display font-black text-2xl mb-1 leading-tight">{promo.highlight}</h3>
                  <p className="text-xs opacity-90 truncate">{promo.description}</p>
                </div>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
