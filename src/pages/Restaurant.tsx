import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Clock, Bike, Info, Plus, Store, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Establishment = Database["public"]["Tables"]["establishments"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductCategory = Database["public"]["Tables"]["product_categories"]["Row"];

interface OpeningHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

const DAYS_PT: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const Restaurant = () => {
  const { id } = useParams();
  const { addItem, items, total } = useCart();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHours, setShowHours] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (id) {
      fetchEstablishment();
      fetchProducts();
      fetchCategories();
    }
  }, [id]);

  const fetchEstablishment = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      setEstablishment(data);
    } catch (error) {
      console.error("Erro ao carregar estabelecimento:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("establishment_id", id)
        .eq("is_available", true)
        .order("sort_order");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("establishment_id", id)
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const handleAddItem = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_url || "",
      establishmentId: id,
    });
    toast.success(`${product.name} adicionado ao carrinho!`, {
      position: "bottom-center",
    });
  };

  const getOpeningHours = (): OpeningHours | null => {
    if (!establishment?.opening_hours) return null;
    return establishment.opening_hours as unknown as OpeningHours;
  };

  const getCurrentDayStatus = () => {
    const hours = getOpeningHours();
    if (!hours) return null;

    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = days[new Date().getDay()];
    const todayHours = hours[today];

    if (!todayHours || !todayHours.isOpen) {
      return { isOpen: false, text: "Fechado hoje" };
    }

    return {
      isOpen: true,
      text: `${todayHours.openTime} - ${todayHours.closeTime}`,
    };
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Store className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Estabelecimento não encontrado</h1>
        <Link to="/">
          <Button>Voltar para início</Button>
        </Link>
      </div>
    );
  }

  const currentStatus = getCurrentDayStatus();
  const openingHours = getOpeningHours();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Image */}
      <div className="relative h-48 md:h-64">
        {establishment.cover_url ? (
          <img
            src={establishment.cover_url}
            alt={establishment.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

        {/* Back Button */}
        <Link to="/">
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 left-4 rounded-full bg-card/90 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Restaurant Info */}
      <div className="container relative -mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card p-6"
        >
          <div className="flex gap-4">
            {establishment.logo_url ? (
              <img
                src={establishment.logo_url}
                alt={establishment.name}
                className="w-20 h-20 rounded-xl object-cover shadow-soft"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center shadow-soft">
                <Store className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                {establishment.name}
              </h1>
              <p className="text-sm text-muted-foreground mb-2 capitalize">
                {establishment.category}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-semibold">{establishment.rating || 0}</span>
                  <span className="text-muted-foreground">
                    ({establishment.total_reviews || 0})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {establishment.min_delivery_time}-{establishment.max_delivery_time} min
                  </span>
                </div>
                <div className="flex items-center gap-1 text-success">
                  <Bike className="w-4 h-4" />
                  <span className="font-medium">
                    {Number(establishment.delivery_fee) === 0
                      ? "Grátis"
                      : `R$ ${Number(establishment.delivery_fee).toFixed(2).replace(".", ",")}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {establishment.description && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-accent/50">
              <Info className="w-4 h-4 text-accent-foreground shrink-0" />
              <p className="text-sm text-accent-foreground">{establishment.description}</p>
            </div>
          )}

          {/* Opening Hours */}
          {openingHours && (
            <div className="mt-4">
              <button
                onClick={() => setShowHours(!showHours)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Clock className="w-4 h-4" />
                <span>
                  {currentStatus?.isOpen ? "Aberto" : "Fechado"}
                  {currentStatus?.text && ` • ${currentStatus.text}`}
                </span>
                <span className="text-muted-foreground">
                  {showHours ? "▲" : "▼"}
                </span>
              </button>

              <AnimatePresence>
                {showHours && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-1">
                      {Object.entries(DAYS_PT).map(([key, label]) => {
                        const dayHours = openingHours[key];
                        return (
                          <div
                            key={key}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">{label}</span>
                            <span className={dayHours?.isOpen ? "" : "text-muted-foreground"}>
                              {dayHours?.isOpen
                                ? `${dayHours.openTime} - ${dayHours.closeTime}`
                                : "Fechado"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Address */}
          {(establishment.address || establishment.neighborhood) && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>
                {establishment.address}
                {establishment.address && establishment.neighborhood && ", "}
                {establishment.neighborhood}
                {establishment.city && ` - ${establishment.city}`}
              </span>
            </div>
          )}
        </motion.div>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="sticky top-16 z-40 bg-background py-4 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? "gradient-primary text-primary-foreground shadow-glow"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="py-4 space-y-4 pb-32">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum produto disponível no momento</p>
            </div>
          ) : (
            filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 p-4 bg-card rounded-xl shadow-soft hover:shadow-card transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    {product.is_featured && (
                      <span className="px-2 py-0.5 text-[10px] font-bold gradient-primary text-primary-foreground rounded-full">
                        TOP
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {product.original_price && Number(product.original_price) > Number(product.price) && (
                      <span className="text-sm text-muted-foreground line-through">
                        R$ {Number(product.original_price).toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    <p className="font-display font-bold text-lg text-primary">
                      R$ {Number(product.price).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>

                <div className="relative shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center">
                      <Store className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="hero"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
                    onClick={() => handleAddItem(product)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Cart Footer */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-lg border-t border-border"
          >
            <div className="container">
              <Link to="/cart">
                <Button variant="hero" size="lg" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm font-bold">
                      {itemCount}
                    </div>
                    <span>Ver carrinho</span>
                  </div>
                  <span className="font-display font-bold">
                    R$ {total.toFixed(2).replace(".", ",")}
                  </span>
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Restaurant;
