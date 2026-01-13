import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ShoppingBag, User, Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-primary-foreground font-display font-bold text-lg">VJ</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-lg leading-tight">VAIJÁ</h1>
              <p className="text-[10px] text-muted-foreground -mt-1">DELIVERY</p>
            </div>
          </Link>

          {/* Location - Desktop */}
          <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-accent transition-colors">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Selecionar endereço</span>
          </button>

          {/* Search - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar restaurantes, pratos..."
                className="w-full h-10 pl-10 pr-4 rounded-full bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 gradient-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Button>
            </Link>
            
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <User className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <Button variant="hero" size="sm" className="hidden sm:flex">
              Entrar
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar restaurantes, pratos..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                
                <button className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-muted hover:bg-accent transition-colors">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Selecionar endereço</span>
                </button>

                <Button variant="hero" className="w-full">
                  Entrar ou Cadastrar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
