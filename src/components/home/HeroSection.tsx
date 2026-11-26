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
    <section className="relative overflow-hidden min-h-[500px] md:min-h-[600px] flex items-center">
      {/* Abstract Background Design */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-white/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 py-12">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[520px]"
          >
            <div className="absolute inset-3 translate-x-3 translate-y-3 rounded-[32px] bg-white/10 blur-sm" />
            <img
              src="/Gemini_Generated_Image_twyfurtwyfurtwyf.jpg"
              alt="Tudo da sua cidade em um único app"
              className="relative w-full max-h-[560px] object-contain object-center rounded-[32px] shadow-elevated"
            />
          </motion.div>

          <div className="text-left space-y-6 md:space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center lg:justify-start"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-bold border border-white/30 backdrop-blur-sm">
                <Zap className="w-4 h-4 fill-white" />
                <span>EXPRESS DELIVERY • 20 MIN</span>
              </div>
            </motion.div>

            <div className="hidden sm:block space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                className="text-lg md:text-xl text-white/80 max-w-lg leading-relaxed"
              >
                De delivery de comida a serviços profissionais e imóveis. Encontre tudo o que você precisa no Vai Já.
              </motion.p>
            </div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.7, type: "spring", bounce: 0.4 }}
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
                  placeholder="O que você está procurando hoje?"
                  className="w-full h-16 md:h-20 pl-16 pr-16 md:pr-40 rounded-3xl bg-white shadow-card border-none text-base md:text-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 md:h-16 px-4 md:px-8 gradient-primary text-primary-foreground font-black rounded-2xl shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  <span className="hidden md:inline">BUSCAR</span>
                  <Search className="w-5 h-5 md:hidden text-white" />
                </button>
              </form>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-400/20 rounded-[34px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>

            {/* Feature Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
              className="flex flex-wrap items-center gap-6 pt-4"
            >
              {[
                { icon: Clock, label: "Entrega em 20 min", color: "text-orange-600", bg: "bg-white" },
                { icon: Shield, label: "Pagamento 100% Seguro", color: "text-blue-600", bg: "bg-white" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-soft">
                  <div className={`w-8 h-8 rounded-full ${feature.bg} flex items-center justify-center`}>
                    <feature.icon className={`w-4 h-4 ${feature.color}`} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{feature.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
