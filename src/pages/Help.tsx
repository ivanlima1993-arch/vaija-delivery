import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, MessageCircle, Mail, Phone, ExternalLink, ChevronDown, Headset, BookOpen, ShieldCheck, CreditCard, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const faqs = [
  {
    category: "Pedidos e Entrega",
    icon: <BookOpen className="w-5 h-5" />,
    questions: [
      {
        q: "Qual o prazo para o restaurante confirmar meu pedido?",
        a: "O estabelecimento tem até 30 minutos para confirmar seu pedido. Caso esse prazo seja ultrapassado, o sistema cancela o pedido automaticamente por segurança e o valor é estornado (em casos de pagamento online)."
      },
      {
        q: "Posso cancelar um pedido que acabei de fazer?",
        a: "Sim. Se o estabelecimento ainda não confirmou o pedido, a opção de cancelamento ficará disponível para você no app após 10 minutos de espera."
      },
      {
        q: "Como acompanho a entrega?",
        a: "Na tela 'Acompanhar Pedido', você verá o status em tempo real. Quando o entregador estiver em rota, um mapa aparecerá para você seguir o trajeto até sua casa."
      },
      {
        q: "O que fazer se meu pedido vier errado?",
        a: "Você deve abrir o chat direto com o estabelecimento através do botão flutuante na tela do pedido ou entrar em contato pelos canais de suporte da loja."
      }
    ]
  },
  {
    category: "Serviços e Imóveis",
    icon: <ExternalLink className="w-5 h-5" />,
    questions: [
      {
        q: "Como contrato um profissional de serviços?",
        a: "Acesse a aba 'Serviços', escolha a categoria desejada, analise o perfil e as avaliações do profissional e inicie um chat direto para solicitar um orçamento."
      },
      {
        q: "Como funciona a compra/aluguel de imóveis?",
        a: "Você pode navegar pelos imóveis disponíveis, ver fotos e detalhes. Caso tenha interesse, clique em 'Falar com Corretor' para iniciar uma conversa direta via chat ou WhatsApp."
      }
    ]
  },
  {
    category: "Pagamentos e Carteira",
    icon: <CreditCard className="w-5 h-5" />,
    questions: [
      {
        q: "Quais as formas de pagamento?",
        a: "Aceitamos PIX, Cartões de Crédito Online, Dinheiro e Cartão na Entrega. Algumas lojas podem oferecer cashback que vai direto para sua Carteira Digital no app."
      },
      {
        q: "Como uso meu saldo da Carteira?",
        a: "No momento do checkout, se você tiver saldo disponível, poderá selecioná-lo como forma de pagamento total ou parcial do seu pedido."
      }
    ]
  },
  {
    category: "Segurança",
    icon: <ShieldCheck className="w-5 h-5" />,
    questions: [
      {
        q: "Meus dados estão seguros?",
        a: "Sim, utilizamos criptografia de ponta a ponta e processadores de pagamento certificados (Asaas/Supabase). Seus dados seguem as normas da LGPD."
      }
    ]
  }
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Sua mensagem foi enviada! Nossa equipe entrará em contato em breve.");
      setSubmitting(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center gap-4 h-16">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-display font-bold text-lg">Central de Ajuda</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-primary/5 py-12 px-4 text-center">
        <div className="container max-w-2xl">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black mb-4 font-display"
          >
            Como podemos ajudar?
          </motion.h2>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Pesquisar dúvidas frequentes..." 
              className="pl-12 h-14 rounded-2xl shadow-lg border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="container py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-lg mb-4 text-white">Canais de Atendimento</h3>
          
          <Card 
            className="border-none shadow-soft bg-green-500/5 hover:bg-green-500/10 transition-colors cursor-pointer"
            onClick={() => window.open("https://wa.me/5579988320546", "_blank")}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-white">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900">WhatsApp</p>
                <p className="text-xs text-gray-500">(79) 98832-0546</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
            </CardContent>
          </Card>

          <Card 
            className="border-none shadow-soft bg-pink-500/5 hover:bg-pink-500/10 transition-colors cursor-pointer"
            onClick={() => window.open("https://instagram.com/vaijadelivery", "_blank")}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Instagram</p>
                <p className="text-xs text-gray-500">Siga @vaijadelivery</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
            </CardContent>
          </Card>

          <Card 
            className="border-none shadow-soft bg-orange-500/5 hover:bg-orange-500/10 transition-colors cursor-pointer"
            onClick={() => window.location.href = "mailto:vaijadeliveryoficial@gmail.com"}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900">E-mail</p>
                <p className="text-xs text-gray-500">vaijadeliveryoficial@gmail.com</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
            </CardContent>
          </Card>

          <div className="pt-6">
            <h4 className="font-bold mb-4">Ainda precisa de ajuda?</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Seu nome" required />
              <Input placeholder="E-mail" type="email" required />
              <textarea 
                placeholder="Descreva seu problema..." 
                className="w-full min-h-[120px] rounded-2xl border border-input bg-background p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                required
              />
              <Button type="submit" className="w-full h-12" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </form>
          </div>
        </div>

        {/* FAQs */}
        <div className="lg:col-span-2">
          <h3 className="font-bold text-lg mb-6 text-white">Perguntas Frequentes</h3>
          <div className="space-y-8">
            {faqs.map((cat, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-4 text-primary">
                  {cat.icon}
                  <h4 className="font-black uppercase tracking-widest text-xs text-white">
                    {cat.category}
                  </h4>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {cat.questions.map((q, qIdx) => (
                    <AccordionItem 
                      key={qIdx} 
                      value={`item-${idx}-${qIdx}`}
                      className="border rounded-2xl px-4 bg-card"
                    >
                      <AccordionTrigger className="hover:no-underline font-bold text-left text-gray-900">
                        {q.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 leading-relaxed font-medium">
                        {q.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
