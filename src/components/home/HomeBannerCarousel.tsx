import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  link_url: string | null;
}

const FALLBACK_BANNERS = [
  {
    id: "1",
    image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
    title: "Sua refeição favorita",
    subtitle: "Entregue com velocidade em qualquer lugar da cidade.",
    button_text: "Peça Agora",
    link_url: "/restaurantes"
  },
  {
    id: "2",
    image_url: "https://images.unsplash.com/photo-1556911220-e15224bbafb0?q=80&w=1200&auto=format&fit=crop",
    title: "Profissionais de Confiança",
    subtitle: "De eletricistas a diaristas. Profissionais avaliados para sua casa.",
    button_text: "Ver Serviços",
    link_url: "/servicos"
  }
];

const HomeBannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("home_banners")
          .select("*")
          .eq("is_active", true)
          .order("position", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setBanners(data);
        } else {
          setBanners(FALLBACK_BANNERS);
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
        setBanners(FALLBACK_BANNERS);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex, banners.length]);

  const handleNext = () => {
    if (banners.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    if (banners.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="h-[300px] md:h-[450px] w-full rounded-[2.5rem] bg-muted animate-pulse flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <section className="container py-8 relative group">
      <div className="relative h-[300px] md:h-[450px] overflow-hidden rounded-[2.5rem] shadow-2xl bg-muted">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentBanner.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentBanner.image_url})` }}
            >
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 space-y-4 md:space-y-6">
              {currentBanner.title && (
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter"
                >
                  {currentBanner.title}
                </motion.h2>
              )}
              {currentBanner.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg md:text-xl text-white/90 max-w-lg font-medium"
                >
                  {currentBanner.subtitle}
                </motion.p>
              )}
              {currentBanner.link_url && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    className="bg-white text-black hover:bg-white/90 font-black rounded-2xl h-14 px-8 group shadow-glow"
                    onClick={() => window.location.href = currentBanner.link_url || "#"}
                  >
                    {currentBanner.button_text || "Ver Mais"}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              onClick={handlePrev}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-black transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-black transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentIndex ? 1 : -1);
                  setCurrentIndex(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeBannerCarousel;
