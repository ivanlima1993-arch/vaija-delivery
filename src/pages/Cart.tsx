import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, Clock, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import DeliveryAddressSelector, { DeliveryAddress } from "@/components/cart/DeliveryAddressSelector";

const paymentMethods = [
  { id: "pix", name: "Pix", icon: QrCode, description: "Aprovação instantânea" },
  { id: "card", name: "Cartão", icon: CreditCard, description: "Crédito ou débito" },
  { id: "cash", name: "Dinheiro", icon: Banknote, description: "Pague na entrega" },
];

const Cart = () => {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState("pix");
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);
  
  const deliveryFee = deliveryAddress?.deliveryFee ?? 0;
  const finalTotal = total + deliveryFee;

  const handleCheckout = () => {
    if (!deliveryAddress) {
      toast.error("Selecione um endereço de entrega");
      return;
    }
    
    toast.success("Pedido realizado com sucesso! 🎉", {
      description: "Você receberá atualizações sobre seu pedido.",
    });
    clearCart();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
          <div className="container flex items-center gap-4 h-16">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-display font-bold text-lg">Carrinho</h1>
          </div>
        </header>

        <div className="container py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm mx-auto"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Bike className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Carrinho vazio</h2>
            <p className="text-muted-foreground mb-6">
              Adicione itens de um restaurante para começar seu pedido.
            </p>
            <Link to="/">
              <Button variant="hero" size="lg">
                Explorar restaurantes
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center gap-4 h-16">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-display font-bold text-lg">Carrinho</h1>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Delivery Address */}
        <DeliveryAddressSelector 
          selectedAddress={deliveryAddress}
          onAddressChange={setDeliveryAddress}
        />

        {/* Delivery Time */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 p-4 bg-accent/50 rounded-xl"
        >
          <Clock className="w-5 h-5 text-accent-foreground" />
          <p className="text-sm text-accent-foreground">
            Tempo estimado: <span className="font-semibold">25-35 min</span>
          </p>
        </motion.div>

        {/* Cart Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow-soft overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold">Seu pedido</h2>
          </div>
          
          <div className="divide-y divide-border">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 flex gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-primary font-display font-bold mt-1">
                      R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-xl shadow-soft overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold">Forma de pagamento</h2>
          </div>
          
          <div className="p-4 grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPayment(method.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedPayment === method.id
                    ? "border-primary bg-accent"
                    : "border-transparent bg-muted hover:bg-accent/50"
                }`}
              >
                <method.icon className={`w-6 h-6 mx-auto mb-2 ${
                  selectedPayment === method.id ? "text-primary" : "text-muted-foreground"
                }`} />
                <p className="text-sm font-medium">{method.name}</p>
                <p className="text-[10px] text-muted-foreground">{method.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl shadow-soft p-4 space-y-3"
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>R$ {total.toFixed(2).replace(".", ",")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de entrega</span>
            <span className={deliveryFee === 0 ? "text-success" : ""}>
              {deliveryAddress 
                ? deliveryFee === 0 
                  ? "Grátis" 
                  : `R$ ${deliveryFee.toFixed(2).replace(".", ",")}`
                : "Selecione o endereço"
              }
            </span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-display font-bold text-lg text-primary">
              R$ {finalTotal.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Checkout Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="container">
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full" 
            onClick={handleCheckout}
            disabled={!deliveryAddress}
          >
            Finalizar pedido • R$ {finalTotal.toFixed(2).replace(".", ",")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;