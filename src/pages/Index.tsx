import { useNavigate } from "react-router-dom";
import { Wrench, Sparkles, ArrowRight, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import PromoSection from "@/components/home/PromoSection";
import RestaurantSection from "@/components/home/RestaurantSection";
import Footer from "@/components/layout/Footer";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <main className="pb-20">
        <HeroSection />
        <div className="space-y-4 md:space-y-0">
          <CategorySection />

          {/* Nova Seção de Serviços */}
          <section className="container py-8">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl cursor-pointer group hover:scale-[1.01] transition-transform"
              onClick={() => navigate("/servicos")}
            >
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-widest">
                    <Sparkles className="w-4 h-4" />
                    Novidade: Vai Já Serviços
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter">
                    Precisa de um profissional <br className="hidden md:block" />
                    qualificado agora?
                  </h2>
                  <p className="text-blue-100 text-lg font-medium max-w-md">
                    Eletricistas, encanadores, diaristas e muito mais a um clique de distância. Rápido, seguro e avaliado.
                  </p>
                  <Button className="bg-white text-blue-700 hover:bg-blue-50 font-black rounded-2xl h-14 px-8 mt-4 group">
                    CONTRATAR AGORA
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-[60px] animate-pulse" />
                  <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                    <Wrench className="w-24 h-24 md:w-32 md:h-32 text-white" />
                  </div>
                </div>
              </div>

              {/* Background Shapes */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/20 rounded-full blur-[80px]" />
            </div>
          </section>

          {/* Nova Seção de Imóveis */}
          <section className="container py-4">
            <div
              className="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl cursor-pointer group hover:scale-[1.01] transition-transform"
              onClick={() => navigate("/imoveis")}
            >
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-widest">
                    <Sparkles className="w-4 h-4" />
                    Novo: Vai Já Imóveis
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter">
                    O imóvel dos seus <br className="hidden md:block" />
                    sonhos está aqui.
                  </h2>
                  <p className="text-emerald-100 text-lg font-medium max-w-md">
                    Compre, venda ou alugue com segurança e agilidade direto com os melhores corretores da região.
                  </p>
                  <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-black rounded-2xl h-14 px-8 mt-4 group">
                    VER IMÓVEIS
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-[60px] animate-pulse" />
                  <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 -rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                    <Building className="w-24 h-24 md:w-32 md:h-32 text-white" />
                  </div>
                </div>
              </div>

              {/* Background Shapes */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-[80px]" />
            </div>
          </section>

          <PromoSection />
          <RestaurantSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
