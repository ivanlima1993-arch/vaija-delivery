import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, ShoppingBag, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { useAddress } from "@/contexts/AddressContext";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  establishment_id: string;
  is_featured: boolean | null;
  establishments?: {
    name: string;
    city_id: string | null;
    is_approved: boolean | null;
  } | null;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "mock-1",
    name: "Pizza Calabresa Especial",
    description: "Molho de tomate artesanal, muçarela premium, calabresa defumada fatiada, cebola roxa e azeitonas pretas salpicadas com orégano.",
    price: 39.90,
    original_price: 49.90,
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop",
    establishment_id: "mock-est-1",
    is_featured: true,
    establishments: {
      name: "Forneria Bella Italia",
      city_id: null,
      is_approved: true
    }
  },
  {
    id: "mock-2",
    name: "Smash Burger Duplo",
    description: "Dois blends de 80g de carne bovina grelhados, queijo cheddar derretido, bacon crocante, alface picada e molho especial no pão brioche.",
    price: 26.90,
    original_price: 32.00,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop",
    establishment_id: "mock-est-2",
    is_featured: true,
    establishments: {
      name: "Burger House",
      city_id: null,
      is_approved: true
    }
  },
  {
    id: "mock-3",
    name: "Combinado Temaki & Rolls",
    description: "1 Temaki de Salmão Completo + 4 Uramakis Filadélfia + 4 Hossomakis de Salmão frescos, acompanhados de shoyu e gergelim.",
    price: 59.90,
    original_price: 69.90,
    image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop",
    establishment_id: "mock-est-3",
    is_featured: true,
    establishments: {
      name: "Sushiman Delivery",
      city_id: null,
      is_approved: true
    }
  },
  {
    id: "mock-4",
    name: "Açaí Premium Especial 500ml",
    description: "Copo recheado com açaí puro batido na hora, morangos frescos fatiados, rodelas de banana, leite condensado e leite em pó ninho.",
    price: 22.00,
    original_price: null,
    image_url: "https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=600&auto=format&fit=crop",
    establishment_id: "mock-est-4",
    is_featured: true,
    establishments: {
      name: "Açaí Concept",
      city_id: null,
      is_approved: true
    }
  },
  {
    id: "mock-5",
    name: "Salgados Combo: Coxinha & Pastel",
    description: "2 Coxinhas de Frango com Catupiry crocantes e 2 Pastéis de vento de queijo quentinhos servidos com molho de pimenta da casa.",
    price: 18.50,
    original_price: 24.00,
    image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop",
    establishment_id: "mock-est-5",
    is_featured: true,
    establishments: {
      name: "Salgados do Zé",
      city_id: null,
      is_approved: true
    }
  }
];

const ProductSlideSection = () => {
  const { selectedCityId, isLoading: isCityLoading } = useAddress();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch products with their establishment details
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            price,
            original_price,
            image_url,
            is_featured,
            establishment_id,
            establishments (
              name,
              city_id,
              is_approved
            )
          `)
          .eq("is_available", true);

        if (error) throw error;

        if (data && data.length > 0) {
          // Filter in memory to handle relationship matching safely
          const filtered = data
            .map((p: any) => ({
              ...p,
              establishments: Array.isArray(p.establishments) ? p.establishments[0] : p.establishments
            }))
            .filter((p: Product) => {
              const est = p.establishments;
              if (!est) return false;
              if (est.is_approved === false) return false;
              if (selectedCityId && est.city_id !== selectedCityId) return false;
              return true;
            });

          // Sort so featured products are listed first
          const sorted = [...filtered].sort((a, b) => {
            if (a.is_featured && !b.is_featured) return -1;
            if (!a.is_featured && b.is_featured) return 1;
            return 0;
          });

          if (sorted.length > 0) {
            setProducts(sorted);
          } else {
            setProducts(MOCK_PRODUCTS);
          }
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      } catch (err) {
        console.error("Error fetching products slider:", err);
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    if (!isCityLoading) {
      fetchProducts();
    }
  }, [selectedCityId, isCityLoading]);

  const handleProductClick = (establishmentId: string) => {
    if (establishmentId.startsWith("mock-")) {
      // Mock fallback: redirect to general restaurants page
      navigate("/restaurantes");
    } else {
      navigate(`/restaurant/${establishmentId}`);
    }
  };

  const calculateDiscount = (price: number, originalPrice: number | null) => {
    if (!originalPrice || originalPrice <= price) return null;
    const percent = Math.round(((originalPrice - price) / originalPrice) * 100);
    return `${percent}% OFF`;
  };

  if (loading) {
    return (
      <div className="container py-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <section className="py-12 bg-transparent overflow-hidden">
      <div className="container relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 text-white">
          <div className="space-y-2">
            <Badge className="bg-white/20 text-white border-white/30 font-black text-[10px] px-3 py-1 uppercase tracking-widest backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1 fill-white inline" />
              Seleção Especial
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight leading-none">
              Destaques do Cardápio
            </h2>
            <p className="text-white/80 max-w-md text-sm md:text-base">
              Os pratos e produtos mais queridos da sua região.
            </p>
          </div>
        </div>

        <div className="relative px-1 md:px-0">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full group/carousel"
          >
            <CarouselContent className="-ml-4">
              {products.map((product) => {
                const discountText = calculateDiscount(product.price, product.original_price);
                
                return (
                  <CarouselItem
                    key={product.id}
                    className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                  >
                    <motion.div
                      whileHover={{ y: -6, scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      onClick={() => handleProductClick(product.establishment_id)}
                      className="relative rounded-[2.2rem] bg-card border border-border/40 overflow-hidden shadow-soft hover:shadow-card transition-shadow cursor-pointer flex flex-col h-[390px] w-full"
                    >
                      {/* Product Image */}
                      <div className="relative h-[190px] w-full overflow-hidden shrink-0 bg-muted">
                        <img
                          src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop"}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        
                        {/* Discount Badge */}
                        {discountText && (
                          <div className="absolute top-4 left-4 bg-primary text-white text-[11px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md backdrop-blur-sm bg-opacity-95">
                            {discountText}
                          </div>
                        )}

                        {/* Featured Badge */}
                        {product.is_featured && (
                          <div className="absolute top-4 right-4 bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5 border border-amber-300">
                            <Sparkles className="w-3 h-3 fill-amber-950" />
                            DESTAQUE
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-6 flex flex-col justify-between flex-grow">
                        <div>
                          {/* Store Name */}
                          {product.establishments?.name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold mb-2 uppercase tracking-wide">
                              <Store className="w-3.5 h-3.5 text-primary" />
                              <span className="truncate max-w-[180px]">{product.establishments.name}</span>
                            </div>
                          )}

                          {/* Product Title */}
                          <h3 className="font-display font-black text-lg text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                            {product.name}
                          </h3>

                          {/* Description */}
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed font-medium">
                              {product.description}
                            </p>
                          )}
                        </div>

                        {/* Footer details: Price and button */}
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                          <div className="flex flex-col">
                            {product.original_price && product.original_price > product.price && (
                              <span className="text-[11px] text-muted-foreground line-through leading-none mb-1 font-semibold">
                                R$ {product.original_price.toFixed(2).replace(".", ",")}
                              </span>
                            )}
                            <span className="font-display font-black text-xl text-primary leading-none">
                              R$ {product.price.toFixed(2).replace(".", ",")}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            className="rounded-xl font-bold h-10 px-4 flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all gradient-primary border-none text-white hover:scale-105 active:scale-95"
                          >
                            <ShoppingBag className="w-4 h-4 text-white" />
                            <span>Pedir</span>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            {/* Arrows */}
            <div className="absolute inset-y-1/2 -left-6 -right-6 flex justify-between pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10">
              <CarouselPrevious className="pointer-events-auto h-11 w-11 bg-white/95 text-black border border-border hover:bg-primary hover:text-white transition-all shadow-md rounded-full -translate-y-1/2" />
              <CarouselNext className="pointer-events-auto h-11 w-11 bg-white/95 text-black border border-border hover:bg-primary hover:text-white transition-all shadow-md rounded-full -translate-y-1/2" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default ProductSlideSection;
