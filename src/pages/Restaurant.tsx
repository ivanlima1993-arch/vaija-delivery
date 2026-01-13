import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Clock, Bike, Info, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const restaurantData = {
  id: 1,
  name: "Burger House Premium",
  image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=400&fit=crop",
  logo: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=200&h=200&fit=crop",
  category: "Hambúrgueres • Lanches",
  rating: 4.8,
  ratingCount: 234,
  deliveryTime: "25-35 min",
  deliveryFee: "R$ 5,99",
  minOrder: "R$ 20,00",
  isOpen: true,
  description: "Os melhores hambúrgueres artesanais da cidade. Carnes selecionadas, ingredientes frescos e muito sabor.",
};

const menuCategories = [
  {
    id: 1,
    name: "Mais Pedidos",
    items: [
      {
        id: 101,
        name: "Smash Burger Duplo",
        description: "Dois hambúrgueres smash de 90g, queijo cheddar, cebola caramelizada, picles e molho especial",
        price: 32.9,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
        popular: true,
      },
      {
        id: 102,
        name: "Classic Bacon",
        description: "Hambúrguer artesanal 180g, bacon crocante, queijo, alface, tomate e maionese",
        price: 28.9,
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=200&fit=crop",
      },
    ],
  },
  {
    id: 2,
    name: "Hambúrgueres",
    items: [
      {
        id: 201,
        name: "Cheese Burger",
        description: "Hambúrguer 150g, queijo cheddar derretido, cebola e molho especial",
        price: 24.9,
        image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=300&h=200&fit=crop",
      },
      {
        id: 202,
        name: "BBQ Monster",
        description: "Hambúrguer duplo 360g, onion rings, bacon, cheddar e molho BBQ",
        price: 42.9,
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=200&fit=crop",
        popular: true,
      },
      {
        id: 203,
        name: "Veggie Deluxe",
        description: "Hambúrguer vegetal, queijo, cogumelos, rúcula e maionese de ervas",
        price: 29.9,
        image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300&h=200&fit=crop",
      },
    ],
  },
  {
    id: 3,
    name: "Bebidas",
    items: [
      {
        id: 301,
        name: "Refrigerante Lata",
        description: "Coca-Cola, Guaraná ou Fanta 350ml",
        price: 6.9,
        image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=200&fit=crop",
      },
      {
        id: 302,
        name: "Milkshake",
        description: "Chocolate, Morango ou Ovomaltine 400ml",
        price: 16.9,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop",
      },
    ],
  },
];

const Restaurant = () => {
  const { id } = useParams();
  const { addItem, items, total } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0].id);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddItem = (item: { id: number; name: string; price: number; image: string }) => {
    addItem(item);
    toast.success(`${item.name} adicionado ao carrinho!`, {
      position: "bottom-center",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Image */}
      <div className="relative h-48 md:h-64">
        <img
          src={restaurantData.image}
          alt={restaurantData.name}
          className="w-full h-full object-cover"
        />
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
            <img
              src={restaurantData.logo}
              alt={restaurantData.name}
              className="w-20 h-20 rounded-xl object-cover shadow-soft"
            />
            <div className="flex-1">
              <h1 className="font-display text-xl md:text-2xl font-bold mb-1">
                {restaurantData.name}
              </h1>
              <p className="text-sm text-muted-foreground mb-2">{restaurantData.category}</p>
              
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-semibold">{restaurantData.rating}</span>
                  <span className="text-muted-foreground">({restaurantData.ratingCount})</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{restaurantData.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-1 text-success">
                  <Bike className="w-4 h-4" />
                  <span className="font-medium">{restaurantData.deliveryFee}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-accent/50">
            <Info className="w-4 h-4 text-accent-foreground shrink-0" />
            <p className="text-sm text-accent-foreground">{restaurantData.description}</p>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <div className="sticky top-16 z-40 bg-background py-4 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {menuCategories.map((category) => (
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

        {/* Menu Items */}
        <div className="py-4 space-y-8 pb-32">
          {menuCategories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h2 className="font-display text-lg font-bold">{category.name}</h2>
              
              <div className="space-y-3">
                {category.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 p-4 bg-card rounded-xl shadow-soft hover:shadow-card transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.popular && (
                          <span className="px-2 py-0.5 text-[10px] font-bold gradient-primary text-primary-foreground rounded-full">
                            TOP
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                      <p className="font-display font-bold text-lg mt-2 text-primary">
                        R$ {item.price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    
                    <div className="relative shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                      <Button
                        size="icon"
                        variant="hero"
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
                        onClick={() => handleAddItem(item)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
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
