import Header from "@/components/layout/Header";
import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import PromoSection from "@/components/home/PromoSection";
import RestaurantSection from "@/components/home/RestaurantSection";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <main className="pb-20">
        <HeroSection />
        <div className="space-y-4 md:space-y-0">
          <CategorySection />
          <PromoSection />
          <RestaurantSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
