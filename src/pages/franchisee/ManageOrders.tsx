import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  XCircle,
  ChefHat,
  Truck,
  Package,
  ArrowLeft,
  Printer,
  CreditCard,
  Wallet,
  Building2,
  Filter,
} from "lucide-react";
import ChatButton from "@/components/chat/ChatButton";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-yellow-500", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-blue-500", icon: CheckCircle },
  preparing: { label: "Preparando", color: "bg-orange-500", icon: ChefHat },
  ready: { label: "Pronto", color: "bg-green-500", icon: Package },
  out_for_delivery: { label: "Em Entrega", color: "bg-purple-500", icon: Truck },
  delivered: { label: "Entregue", color: "bg-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: XCircle },
};

const ManageOrders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchData();
    }

    // Realtime subscription for orders
    const channel = supabase
      .channel("regional-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders(); // Refresh orders on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      // 1. Fetch managed cities
      const { data: cities } = await supabase
        .from("franchisee_cities")
        .select("city_id")
        .eq("franchisee_id", user!.id);

      const cityIds = cities?.map(c => c.city_id) || [];

      // 2. Fetch establishments in these cities
      const { data: estabs } = await supabase
        .from("establishments")
        .select("id, name")
        .in("city_id", cityIds);

      setEstablishments(estabs || []);
      
      // 3. Fetch orders
      await fetchOrders(cityIds);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (cityIdsParam?: string[]) => {
    let ids = cityIdsParam;
    if (!ids) {
       const { data: cities } = await supabase
        .from("franchisee_cities")
        .select("city_id")
        .eq("franchisee_id", user!.id);
       ids = cities?.map(c => c.city_id) || [];
    }

    const { data: estabs } = await supabase
        .from("establishments")
        .select("id")
        .in("city_id", ids);
    
    const estabIds = estabs?.map(e => e.id) || [];

    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("establishment_id", estabIds)
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data);
      // Fetch items only for visible orders to avoid overhead
      data.slice(0, 20).forEach(o => fetchOrderItems(o.id));
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (data) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Erro ao atualizar pedido");
    } else {
      toast.success(`Pedido atualizado para: ${statusConfig[newStatus]?.label}`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filter === "all" ? true : o.status === filter;
    const matchesEstab = selectedEstablishment === "all" ? true : o.establishment_id === selectedEstablishment;
    return matchesStatus && matchesEstab;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
           <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate("/franqueado")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-black">Gestão Regional de Pedidos</h1>
                <p className="text-muted-foreground">Monitoramento e ações em tempo real</p>
              </div>
           </div>
           
           <div className="flex flex-wrap gap-2">
              <div className="relative">
                 <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <select 
                   className="pl-9 h-10 rounded-md border bg-background text-sm min-w-[200px]"
                   value={selectedEstablishment}
                   onChange={(e) => setSelectedEstablishment(e.target.value)}
                 >
                    <option value="all">Todos os Estabelecimentos</option>
                    {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                 </select>
              </div>
           </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              Todos ({orders.length})
            </Button>
            {(Object.keys(statusConfig) as OrderStatus[]).map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(status)}
                className="whitespace-nowrap"
              >
                {statusConfig[status].label} ({orders.filter(o => o.status === status).length})
              </Button>
            ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <AnimatePresence>
               {filteredOrders.map((order) => {
                 const statusKey = order.status as OrderStatus;
                 const StatusConfig = statusConfig[statusKey];
                 const StatusIcon = StatusConfig.icon;
                 
                 return (
                   <motion.div key={order.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} layout>
                     <Card className={`cursor-pointer hover:shadow-lg transition-all ${order.status === 'pending' ? 'border-primary shadow-primary/10' : ''}`} onClick={() => {
                       setSelectedOrder(order);
                       fetchOrderItems(order.id);
                     }}>
                        <CardHeader className="pb-2">
                           <div className="flex items-center justify-between">
                              <span className="font-bold">#{order.order_number}</span>
                              <Badge className={`${StatusConfig.color} text-white`}>
                                 <StatusIcon className="w-3 h-3 mr-1" /> {StatusConfig.label}
                              </Badge>
                           </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="space-y-1">
                              <p className="text-sm font-bold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {order.customer_name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> {order.delivery_address}</p>
                           </div>

                           <div className="flex items-center justify-between pt-2 border-t">
                              <span className="font-black text-primary">R$ {Number(order.total).toFixed(2)}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleTimeString()}</span>
                           </div>
                        </CardContent>
                     </Card>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
        </div>

        {filteredOrders.length === 0 && (
           <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Nenhum pedido encontrado</h3>
           </div>
        )}
      </main>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                     <h2 className="text-xl font-bold">Pedido #{selectedOrder.order_number}</h2>
                     <div className="flex items-center gap-2">
                        <ChatButton orderId={selectedOrder.id} participantId={selectedOrder.customer_id || ""} participantName={selectedOrder.customer_name} variant="outline" />
                        <Badge className={`${statusConfig[selectedOrder.status as OrderStatus].color} text-white`}>{statusConfig[selectedOrder.status as OrderStatus].label}</Badge>
                     </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-3 text-sm">
                     <p className="font-bold flex items-center gap-2 text-primary"><User className="w-4 h-4" /> {selectedOrder.customer_name}</p>
                     <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {selectedOrder.customer_phone}</p>
                     <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5" /> {selectedOrder.delivery_address}</p>
                  </div>

                  <div className="space-y-3">
                     <h3 className="font-bold text-sm">Itens</h3>
                     <div className="space-y-1">
                        {(orderItems[selectedOrder.id] || []).map(item => (
                          <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded-lg">
                             <span>{item.quantity}x {item.product_name}</span>
                             <span className="font-medium">R$ {Number(item.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between">
                     <span className="text-lg font-black text-primary">Total: R$ {Number(selectedOrder.total).toFixed(2)}</span>
                     <div className="flex gap-2">
                        {selectedOrder.status !== 'cancelled' && (
                          <Button variant="outline" size="sm" className="text-destructive border-destructive" onClick={() => {
                            updateOrderStatus(selectedOrder.id, 'cancelled');
                            setSelectedOrder(null);
                          }}>Cancelar</Button>
                        )}
                        {selectedOrder.status === 'pending' && (
                          <Button size="sm" onClick={() => {
                            updateOrderStatus(selectedOrder.id, 'confirmed');
                            setSelectedOrder(null);
                          }}>Confirmar</Button>
                        )}
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageOrders;
