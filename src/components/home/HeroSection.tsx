import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Zap, Clock, Shield, Star } from "lucide-react";

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
    <section className="relative overflow-hidden bg-[#fff9f5] min-h-[500px] md:min-h-[600px] flex items-center">
      {/* Abstract Background Design */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-orange-400 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 backdrop-blur-sm">
                <Zap className="w-4 h-4 fill-primary" />
                <span>EXPRESS DELIVERY • 20 MIN</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                Sua comida favorita, <br />
                <span className="text-gradient">num piscar de olhos.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                Descubra os melhores sabores da sua cidade com a entrega mais rápida e segura do Brasil.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative max-w-xl group"
            >
              <form onSubmit={handleSearch} className="relative z-10">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  <div className="w-[1px] h-6 bg-border mx-1" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Qual seu desejo de hoje?"
                  className="w-full h-16 md:h-20 pl-16 pr-40 rounded-3xl bg-white shadow-card border-none text-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 md:h-16 px-8 gradient-primary text-primary-foreground font-black rounded-2xl shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  BUSCAR
                </button>
              </form>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-400/20 rounded-[34px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>

            {/* Feature Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-6 pt-4"
            >
              {[
                { icon: Clock, label: "Entrega em 20 min", color: "text-orange-600", bg: "bg-orange-100" },
                { icon: Shield, label: "Pagamento 100% Seguro", color: "text-blue-600", bg: "bg-blue-100" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white">
                  <div className={`w-8 h-8 rounded-full ${feature.bg} flex items-center justify-center`}>
                    <feature.icon className={`w-4 h-4 ${feature.color}`} />
                  </div>
                  <span className="text-sm font-bold text-muted-foreground">{feature.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Visual Elements */}
          <div className="hidden lg:block relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative aspect-square max-w-[500px] ml-auto"
            >
              {/* Main Illustration Placeholder (Transparent PNG of food/bike would go here) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-orange-400/10 rounded-[60px] transform rotate-6 border border-primary/5" />
              <div className="absolute inset-0 bg-white shadow-2xl rounded-[60px] overflow-hidden border border-white flex items-center justify-center p-12">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop"
                  alt="Food"
                  className="w-full h-full object-cover rounded-[40px] shadow-soft"
                />
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 glass-card p-4 rounded-3xl shadow-elevated flex items-center gap-3 border-white/40"
              >
                <div className="w-10 h-10 rounded-2xl bg-success/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-success fill-success" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-success tracking-wider leading-none">Status</p>
                  <p className="text-sm font-bold">Entrega Veloz</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-1/2 -left-12 glass-card p-4 rounded-3xl shadow-elevated flex items-center gap-3 border-white/40"
              >
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-orange-500 tracking-wider leading-none">Ranking</p>
                  <p className="text-sm font-bold">Top da Região</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 right-12 bg-white p-6 rounded-[32px] shadow-elevated border border-orange-50"
              >
                <p className="text-3xl font-black text-primary leading-tight">150+</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Opções Próximas</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
