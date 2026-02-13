import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Minus, Trash2, Clock, Bike, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import DeliveryAddressSelector, { DeliveryAddress } from "@/components/cart/DeliveryAddressSelector";
import { CouponInput, calculateCouponDiscount } from "@/components/cart/CouponInput";
import { RegionalPromotions } from "@/components/cart/RegionalPromotions";
import PaymentMethodSelector from "@/components/cart/PaymentMethodSelector";
import AsaasPixModal from "@/components/cart/AsaasPixModal";
import AsaasCreditCardModal, { type CardData } from "@/components/cart/AsaasCreditCardModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
}

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_type: "percentage" | "fixed" | "free_delivery";
  discount_value: number;
  min_order_value: number | null;
}

const Cart = () => {
  const { items, updateQuantity, removeItem, total, clearCart, establishmentId } = useCart();
  const [selectedPayment, setSelectedPayment] = useState("pix");
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<{ paymentId: string; pixQrCode: string; pixCopyPaste: string } | null>(null);
  const [creditCardModalOpen, setCreditCardModalOpen] = useState(false);
  const [processingCard, setProcessingCard] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [cpf, setCpf] = useState("");
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const deliveryFee = deliveryAddress?.deliveryFee ?? 0;
  const couponDiscount = calculateCouponDiscount(appliedCoupon, total);

  const getPromotionDiscount = () => {
    if (!appliedPromotion) return { discount: 0, freeDelivery: false };
    if (appliedPromotion.discount_type === "free_delivery") return { discount: 0, freeDelivery: true };
    if (appliedPromotion.discount_type === "percentage") return { discount: (total * appliedPromotion.discount_value) / 100, freeDelivery: false };
    return { discount: appliedPromotion.discount_value, freeDelivery: false };
  };

  const { discount: promotionDiscount, freeDelivery } = getPromotionDiscount();
  const totalDiscount = couponDiscount + promotionDiscount;
  const finalDeliveryFee = freeDelivery ? 0 : deliveryFee;
  const finalTotal = Math.max(0, total - totalDiscount) + finalDeliveryFee;

  const isOnlinePayment = selectedPayment === "pix" || selectedPayment === "credit_card";

  const createOrder = async (paymentStatus: string = "pending") => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", user!.id)
      .single();

    const fullAddress = `${deliveryAddress!.street}, ${deliveryAddress!.number}${deliveryAddress!.complement ? ` - ${deliveryAddress!.complement}` : ""}, ${deliveryAddress!.neighborhoodName}, ${deliveryAddress!.cityName}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: user!.id,
        customer_name: profile?.full_name || "Cliente",
        customer_phone: profile?.phone || "",
        establishment_id: establishmentId!,
        delivery_address: fullAddress,
        delivery_latitude: deliveryAddress!.coordinates?.latitude || null,
        delivery_longitude: deliveryAddress!.coordinates?.longitude || null,
        subtotal: total,
        delivery_fee: finalDeliveryFee,
        discount: totalDiscount,
        total: finalTotal,
        payment_method: selectedPayment as "pix" | "credit_card" | "debit_card" | "cash" | "wallet",
        status: "pending",
        payment_status: paymentStatus,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      product_price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      notes: item.notes || null,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) throw itemsError;

    return order;
  };

  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    if (user) fetchBalance();
  }, [user]);

  const fetchBalance = async () => {
    setUserProfileLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("wallet_balance, cpf_cnpj")
      .eq("user_id", user!.id)
      .single();
    if (data) {
      setUserBalance(Number(data.wallet_balance));
      setCpf(data.cpf_cnpj || "");
    }
    setUserProfileLoading(false);
  };

  const handleCheckout = async () => {
    if (!deliveryAddress) {
      toast.error("Selecione um endereço de entrega");
      return;
    }
    if (!user) {
      toast.error("Faça login para finalizar o pedido");
      navigate("/auth");
      return;
    }
    if (!establishmentId) {
      toast.error("Erro ao identificar o estabelecimento");
      return;
    }

    if (selectedPayment === "wallet" && finalTotal > userBalance) {
      toast.error("Saldo insuficiente na carteira digital");
      return;
    }

    if (isOnlinePayment && (!cpf || cpf.length < 11)) {
      toast.error("CPF/CNPJ é obrigatório para pagamentos online");
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedPayment === "pix") {
        // Create order first with pending payment
        const order = await createOrder("awaiting_payment");
        setCurrentOrderId(order.id);

        // Create PIX payment via Asaas
        const { data, error } = await supabase.functions.invoke("asaas-payment", {
          body: {
            action: "create_pix",
            orderId: order.id,
            amount: finalTotal,
            cpfCnpj: cpf,
          },
        });

        if (error || data?.error) throw new Error(data?.error || "Erro ao criar pagamento PIX");

        setPixData({
          paymentId: data.paymentId,
          pixQrCode: data.pixQrCode,
          pixCopyPaste: data.pixCopyPaste,
        });
        setPixModalOpen(true);
      } else if (selectedPayment === "credit_card") {
        // Show credit card form
        const order = await createOrder("awaiting_payment");
        setCurrentOrderId(order.id);
        setCreditCardModalOpen(true);
      } else if (selectedPayment === "wallet") {
        // Debit from wallet
        const order = await createOrder("paid");

        // Create wallet transaction
        const { error: txError } = await supabase
          .from("wallet_transactions")
          .insert({
            user_id: user.id,
            amount: finalTotal,
            type: "debit",
            description: `Pagamento do Pedido #${order.order_number}`,
            order_id: order.id
          });

        if (txError) throw txError;

        toast.success("Pedido pago com saldo digital! 🎉");
        clearCart();
        navigate(`/pedido/${order.id}`);
      } else {
        // Cash/debit - offline payment
        const order = await createOrder("pending");
        toast.success("Pedido realizado com sucesso! 🎉", {
          description: "Você receberá atualizações sobre seu pedido.",
        });
        clearCart();
        navigate(`/pedido/${order.id}`);
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast.error("Erro ao finalizar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreditCardSubmit = async (cardData: CardData) => {
    if (!currentOrderId) return;
    setProcessingCard(true);

    try {
      const { data, error } = await supabase.functions.invoke("asaas-payment", {
        body: {
          action: "create_credit_card",
          orderId: currentOrderId,
          amount: finalTotal,
          cardHolder: cardData.cardHolder,
          cardNumber: cardData.cardNumber,
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          ccv: cardData.ccv,
          holderInfo: {
            cpfCnpj: cardData.cpfCnpj,
            phone: cardData.phone,
            postalCode: cardData.postalCode,
            addressNumber: cardData.addressNumber,
          },
        },
      });

      if (error || data?.error) throw new Error(data?.error || "Erro no pagamento");

      if (data.status === "CONFIRMED" || data.status === "RECEIVED") {
        await supabase.from("orders").update({ payment_status: "paid" }).eq("id", currentOrderId);
        toast.success("Pagamento aprovado! 🎉");
        clearCart();
        navigate(`/pedido/${currentOrderId}`);
      } else if (data.status === "PENDING") {
        await supabase.from("orders").update({ payment_status: "processing" }).eq("id", currentOrderId);
        toast.success("Pedido realizado! Pagamento em processamento.");
        clearCart();
        navigate(`/pedido/${currentOrderId}`);
      } else {
        toast.error("Pagamento recusado. Verifique os dados do cartão.");
      }
    } catch (error) {
      console.error("Credit card payment error:", error);
      toast.error("Erro no pagamento. Verifique os dados e tente novamente.");
    } finally {
      setProcessingCard(false);
    }
  };

  const handlePixConfirmed = async () => {
    if (currentOrderId) {
      await supabase.from("orders").update({ payment_status: "paid" }).eq("id", currentOrderId);
      clearCart();
      navigate(`/pedido/${currentOrderId}`);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
          <div className="container flex items-center gap-4 h-16">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <h1 className="font-display font-bold text-lg">Carrinho</h1>
          </div>
        </header>
        <div className="container py-20 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Bike className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Carrinho vazio</h2>
            <p className="text-muted-foreground mb-6">Adicione itens de um restaurante para começar seu pedido.</p>
            <Link to="/"><Button variant="hero" size="lg">Explorar restaurantes</Button></Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center gap-4 h-16">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <h1 className="font-display font-bold text-lg">Carrinho</h1>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        <DeliveryAddressSelector selectedAddress={deliveryAddress} onAddressChange={setDeliveryAddress} />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex items-center gap-3 p-4 bg-accent/50 rounded-xl">
          <Clock className="w-5 h-5 text-accent-foreground" />
          <p className="text-sm text-accent-foreground">Tempo estimado: <span className="font-semibold">25-35 min</span></p>
        </motion.div>

        {/* Cart Items */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl shadow-soft overflow-hidden">
          <div className="p-4 border-b border-border"><h2 className="font-display font-bold">Seu pedido</h2></div>
          <div className="divide-y divide-border">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div key={item.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-4 flex gap-4">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-primary font-display font-bold mt-1">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-destructive" /> : <Minus className="w-4 h-4" />}
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <RegionalPromotions
          cityId={deliveryAddress?.cityId}
          neighborhoodId={deliveryAddress?.neighborhoodId}
          establishmentId={establishmentId}
          subtotal={total}
          onPromotionApply={setAppliedPromotion}
        />
        <CouponInput
          subtotal={total}
          cityId={deliveryAddress?.cityId}
          neighborhoodId={deliveryAddress?.neighborhoodId}
          establishmentId={establishmentId}
          appliedCoupon={appliedCoupon}
          onApplyCoupon={setAppliedCoupon}
        />

        {/* Payment Method - Dynamic from establishment */}
        <PaymentMethodSelector
          establishmentId={establishmentId}
          selectedPayment={selectedPayment}
          onSelect={setSelectedPayment}
          userBalance={userBalance}
        />

        {/* CPF/CNPJ for Online Payment */}
        {isOnlinePayment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-soft p-4 space-y-4"
          >
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold">Dados para pagamento</h2>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CPF ou CNPJ (apenas números)</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Necessário para emissão do comprovante de pagamento via Asaas.
              </p>
            </div>
          </motion.div>
        )}

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl shadow-soft p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>R$ {total.toFixed(2).replace(".", ",")}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>Cupom ({appliedCoupon?.code})</span>
              <span>-R$ {couponDiscount.toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          {promotionDiscount > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>Promoção</span>
              <span>-R$ {promotionDiscount.toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Taxa de entrega</span>
              {deliveryAddress?.distanceKm && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{deliveryAddress.distanceKm.toFixed(1)} km</span>
              )}
            </div>
            <span className={finalDeliveryFee === 0 ? "text-success" : ""}>
              {deliveryAddress ? (finalDeliveryFee === 0 ? (freeDelivery ? "Grátis (promoção)" : "Grátis") : `R$ ${finalDeliveryFee.toFixed(2).replace(".", ",")}`) : "Selecione o endereço"}
            </span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm font-medium text-success bg-success/10 -mx-4 px-4 py-2">
              <span>Você está economizando</span>
              <span>R$ {(totalDiscount + (freeDelivery ? deliveryFee : 0)).toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-display font-bold text-lg text-primary">R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
          </div>
        </motion.div>
      </div>

      {/* Checkout Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="container">
          <Button variant="hero" size="lg" className="w-full" onClick={handleCheckout} disabled={!deliveryAddress || isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Finalizando...</>
            ) : (
              `Finalizar pedido • R$ ${finalTotal.toFixed(2).replace(".", ",")}`
            )}
          </Button>
        </div>
      </div>

      {/* Asaas PIX Modal */}
      <AsaasPixModal open={pixModalOpen} onClose={() => setPixModalOpen(false)} pixData={pixData} onPaymentConfirmed={handlePixConfirmed} />

      {/* Asaas Credit Card Modal */}
      <AsaasCreditCardModal open={creditCardModalOpen} onClose={() => setCreditCardModalOpen(false)} onSubmit={handleCreditCardSubmit} isProcessing={processingCard} />
    </div>
  );
};

export default Cart;
