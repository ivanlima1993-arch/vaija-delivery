import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_BANNERS = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
    title: "Sua refeição favorita",
    subtitle: "Entregue com velocidade em qualquer lugar da cidade.",
    buttonText: "Peça Agora",
    link: "/restaurantes",
    gradient: "from-primary/80 to-transparent"
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1556911220-e15224bbafb0?q=80&w=1200&auto=format&fit=crop",
    title: "Profissionais de Confiança",
    subtitle: "De eletricistas a diaristas. Profissionais avaliados para sua casa.",
    buttonText: "Ver Serviços",
    link: "/servicos",
    gradient: "from-blue-600/80 to-transparent"
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop",
    title: "O Imóvel dos Seus Sonhos",
    subtitle: "Compre ou alugue com os melhores corretores da região.",
    buttonText: "Explorar Imóveis",
    link: "/imoveis",
    gradient: "from-emerald-600/80 to-transparent"
  }
];

const HomeBannerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % MOCK_BANNERS.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + MOCK_BANNERS.length) % MOCK_BANNERS.length);
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

  return (
    <section className="container py-8 relative group">
      <div className="relative h-[300px] md:h-[450px] overflow-hidden rounded-[2.5rem] shadow-2xl bg-muted">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
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
              style={{ backgroundImage: `url(${MOCK_BANNERS[currentIndex].image})` }}
            >
              {/* Overlay Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-r ${MOCK_BANNERS[currentIndex].gradient} via-black/20 to-transparent`} />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 space-y-4 md:space-y-6">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter"
              >
                {MOCK_BANNERS[currentIndex].title.split(" ").map((word, i) => (
                  <span key={i} className="inline-block mr-3">{word}</span>
                ))}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg md:text-xl text-white/90 max-w-lg font-medium"
              >
                {MOCK_BANNERS[currentIndex].subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  className="bg-white text-black hover:bg-white/90 font-black rounded-2xl h-14 px-8 group shadow-glow"
                  onClick={() => window.location.href = MOCK_BANNERS[currentIndex].link}
                >
                  {MOCK_BANNERS[currentIndex].buttonText}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
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

        {/* Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {MOCK_BANNERS.map((_, i) => (
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
      </div>
    </section>
  );
};

export default HomeBannerCarousel;
