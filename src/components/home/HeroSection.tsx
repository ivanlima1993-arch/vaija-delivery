import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Zap, Clock, Shield } from "lucide-react";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Entrega em minutos
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
          >
            Pediu, chegou.{" "}
            <span className="text-gradient">Vai Já!</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto"
          >
            Os melhores restaurantes, mercados e farmácias da sua cidade com entrega rápida e taxas justas.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-xl mx-auto mb-10"
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que você quer comer hoje?"
                className="w-full h-14 pl-12 pr-32 rounded-2xl bg-card shadow-card border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-soft hover:shadow-glow transition-all active:scale-[0.98]"
              >
                Buscar
              </button>
            </form>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-success" />
              </div>
              <span>Entrega rápida</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span>Taxas baixas</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-info" />
              </div>
              <span>Pagamento seguro</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
