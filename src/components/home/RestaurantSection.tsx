import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAddress } from "@/contexts/AddressContext";
import RestaurantCard from "./RestaurantCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Star, Bike, Clock, Search, MapPin, MessageSquare, Send, CheckCircle2, Phone, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface Establishment {
  id: string;
  name: string;
  cover_url: string | null;
  category: string;
  rating: number | null;
  min_delivery_time: number | null;
  max_delivery_time: number | null;
  delivery_fee: number | null;
  is_open: boolean | null;
}

const RestaurantSection = () => {
  const { selectedCityId, isLoading: isCityLoading, selectedCityName } = useAddress();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  
  const [totalStoresInCity, setTotalStoresInCity] = useState<number | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [clientName, setClientName] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    // Format: (XX) XXXXX-XXXX
    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setWhatsapp(value);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsapp || whatsapp.length < 14) {
      toast.error("Por favor, insira um número de WhatsApp válido.");
      return;
    }

    setIsSubmittingLead(true);
    try {
      const cityNameClean = selectedCityName ? selectedCityName.split(" - ")[0] : "Cidade Desconhecida";
      const { error } = await supabase
        .from('prospects')
        .insert([{
          name: clientName || "Cliente Interessado na Expansão",
          type: "person",
          contact_info: whatsapp,
          city: cityNameClean,
          status: "Novo",
          notes: `Cliente solicitou aviso de expansão para a cidade ${selectedCityName}. Nome: ${clientName || 'Não informado'}.`
        }]);

      if (error) throw error;
      
      setLeadSubmitted(true);
      toast.success("WhatsApp registrado com sucesso!");
    } catch (err: any) {
      console.error('Error submitting expansion lead:', err);
      toast.error("Ocorreu um erro ao salvar seu contato. Tente novamente.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const filters = [
    { id: "all", label: "Tudo", icon: Zap },
    { id: "top", label: "Melhor Avaliados", icon: Star },
    { id: "free", label: "Entrega Grátis", icon: Bike },
    { id: "fast", label: "Mais Rápidos", icon: Clock },
  ];

  useEffect(() => {
    const fetchEstablishments = async () => {
      setIsLoading(true);

      // Check total approved stores in this city
      if (selectedCityId) {
        const { count, error: countError } = await supabase
          .from("establishments")
          .select("id", { count: "exact", head: true })
          .eq("city_id", selectedCityId)
          .eq("is_approved", true);
        
        if (!countError) {
          setTotalStoresInCity(count || 0);
        } else {
          setTotalStoresInCity(0);
        }
      } else {
        setTotalStoresInCity(null);
      }

      let query = supabase
        .from("establishments")
        .select("id, name, cover_url, category, rating, min_delivery_time, max_delivery_time, delivery_fee, is_open")
        .eq("is_approved", true);

      // Apply sorting/filtering based on activeFilter
      if (activeFilter === "top") {
        query = query.order("rating", { ascending: false });
      } else if (activeFilter === "fast") {
        query = query.order("min_delivery_time", { ascending: true });
      } else {
        query = query.order("rating", { ascending: false });
      }

      if (selectedCityId) {
        query = query.eq("city_id", selectedCityId);
      }

      const { data, error } = await query;

      if (!error && data) {
        let filteredData = data;
        if (activeFilter === "free") {
          filteredData = data.filter(est => !est.delivery_fee || est.delivery_fee === 0);
        }
        setEstablishments(filteredData.slice(0, 6));
      }
      setIsLoading(false);
    };

    if (!isCityLoading) {
      fetchEstablishments();
      // Reset lead submission status when city changes
      setLeadSubmitted(false);
      setWhatsapp("");
      setClientName("");
    }
  }, [selectedCityId, isCityLoading, activeFilter]);

  const formatDeliveryTime = (min: number | null, max: number | null) => {
    if (!min && !max) return "30-45 min";
    if (!max) return `${min} min`;
    return `${min}-${max} min`;
  };

  const formatDeliveryFee = (fee: number | null) => {
    if (!fee || fee === 0) return "Grátis";
    return `R$ ${fee.toFixed(2).replace(".", ",")}`;
  };

  const mappedRestaurants = establishments.map((est) => ({
    id: est.id,
    name: est.name,
    image: est.cover_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop",
    category: est.category,
    rating: est.rating || 0,
    deliveryTime: formatDeliveryTime(est.min_delivery_time, est.max_delivery_time),
    deliveryFee: formatDeliveryFee(est.delivery_fee),
    isOpen: est.is_open ?? false,
  }));

  return (
    <section className="py-16 bg-transparent">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <Badge className="bg-white/20 text-white border-white/30 font-black text-[10px] px-3 py-1 uppercase tracking-widest backdrop-blur-sm">
              Seleção Premium
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight leading-none text-white">
              Comerciantes em Destaque
            </h2>
            <p className="text-white/80 max-w-md">
              Os melhores estabelecimentos e lojistas da sua região.
            </p>
          </div>

          <Link
            to="/restaurantes"
            className="hidden md:flex items-center gap-2 font-black text-sm text-white group"
          >
            Ver catálogo completo
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </Link>
        </div>

        {/* Filters */}
        {totalStoresInCity !== 0 && (
          <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 mb-4">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shadow-sm border ${activeFilter === filter.id
                  ? "bg-primary text-white border-primary shadow-glow scale-105"
                  : "bg-white text-muted-foreground border-border hover:border-primary/50"
                  }`}
              >
                <filter.icon className={`w-4 h-4 ${activeFilter === filter.id ? "fill-white" : ""}`} />
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl sm:rounded-[28px] overflow-hidden shadow-soft">
                <Skeleton className="aspect-[16/11] w-full" />
                <div className="p-3 sm:p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : totalStoresInCity === 0 ? (
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-6">
            {/* Card 1: Expansão Clientes */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[32px] p-8 md:p-10 shadow-2xl border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/20 transition-all duration-700"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-black text-[10px] px-3 py-1 uppercase tracking-widest mb-3 backdrop-blur-sm">
                    Expansão
                  </Badge>
                  <h3 className="text-2xl md:text-3xl font-black font-display tracking-tight leading-tight">
                    Quer o Vai Já Delivery na sua cidade?
                  </h3>
                  <p className="text-slate-400 mt-2 text-sm md:text-base">
                    Ainda não temos estabelecimentos cadastrados em <strong className="text-white font-bold">{selectedCityName || "sua região"}</strong>. Cadastre seu WhatsApp para ser avisado em primeira mão assim que iniciarmos as entregas!
                  </p>
                </div>

                {!leadSubmitted ? (
                  <form onSubmit={handleLeadSubmit} className="space-y-3 mt-6">
                    <div className="space-y-1">
                      <Input
                        type="text"
                        placeholder="Seu nome (opcional)"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="bg-slate-950/50 border-slate-800 text-white rounded-xl h-12 focus-visible:ring-primary focus-visible:border-primary placeholder:text-slate-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={whatsapp}
                        onChange={handleWhatsappChange}
                        required
                        className="bg-slate-950/50 border-slate-800 text-white rounded-xl h-12 focus-visible:ring-primary focus-visible:border-primary placeholder:text-slate-500 flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={isSubmittingLead}
                        className="h-12 rounded-xl px-5 font-bold gradient-primary text-white shadow-glow"
                      >
                        {isSubmittingLead ? (
                          "Enviando..."
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Avisar-me
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-4 animate-fade-in">
                    <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-base">Contato salvo com sucesso!</h4>
                      <p className="text-sm text-slate-400 mt-1">
                        Obrigado! Entraremos em contato via WhatsApp assim que chegarmos a {selectedCityName || "sua cidade"}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Recrutamento de Parceiros */}
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-soft border border-border flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border">
                  <Building2 className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <Badge className="bg-muted text-muted-foreground border-border font-black text-[10px] px-3 py-1 uppercase tracking-widest mb-3">
                    Parceria Comercial
                  </Badge>
                  <h3 className="text-2xl md:text-3xl font-black font-display tracking-tight leading-tight text-foreground">
                    Você tem um comércio local?
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm md:text-base">
                    Seja o pioneiro a vender na sua região! Cadastre seu restaurante, mercado ou loja e aproveite condições exclusivas de lançamento.
                  </p>
                </div>

                <ul className="space-y-3 mt-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Taxas reduzidas nos primeiros 3 meses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Destaque garantido na página inicial</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Suporte prioritário e sem burocracia</span>
                  </li>
                </ul>

                <div className="mt-8 pt-4">
                  <Link
                    to="/parceiros"
                    state={{ city: selectedCityName ? selectedCityName.split(" - ")[0] : "" }}
                  >
                    <Button className="w-full h-14 rounded-2xl font-black gradient-primary shadow-glow text-white text-base">
                      CADASTRAR MEU COMÉRCIO
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : mappedRestaurants.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] shadow-soft border border-dashed border-border">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-black mb-2">Ops! Nada por aqui.</h3>
            <p className="text-muted-foreground mb-8">Não encontramos comerciantes com este filtro na sua região.</p>
            <Button variant="outline" onClick={() => setActiveFilter("all")}>Limpar filtros</Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
            {mappedRestaurants.map((restaurant, index) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                index={index}
              />
            ))}
          </div>
        )}

        {totalStoresInCity !== 0 && (
          <div className="mt-12 text-center md:hidden">
            <Link to="/restaurantes">
              <Button className="w-full h-14 rounded-2xl font-black gradient-primary shadow-glow">
                VER TODOS OS COMERCIANTES
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default RestaurantSection;
