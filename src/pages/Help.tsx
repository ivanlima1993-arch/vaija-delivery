import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, MessageCircle, Mail, Phone, ExternalLink, ChevronDown, Headset, BookOpen, ShieldCheck, CreditCard } from "lucide-react";
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
        q: "Como acompanho meu pedido?",
        a: "Após finalizar seu pedido, você será redirecionado para a tela de acompanhamento. Você também pode acessar seus pedidos ativos através do menu do seu perfil."
      },
      {
        q: "Qual o prazo médio de entrega?",
        a: "O prazo varia conforme o estabelecimento e sua localização, geralmente entre 30 e 50 minutos. Você pode ver a estimativa na página de cada restaurante."
      },
      {
        q: "Como cancelo um pedido?",
        a: "Pedidos só podem ser cancelados se ainda não tiverem sido confirmados pelo estabelecimento. Entre em contato diretamente com a loja via chat ou telefone para solicitar o cancelamento."
      }
    ]
  },
  {
    category: "Pagamentos",
    icon: <CreditCard className="w-5 h-5" />,
    questions: [
      {
        q: "Quais formas de pagamento são aceitas?",
        a: "Aceitamos PIX, Cartão de Crédito Online (via Asaas), Saldo da Carteira Digital e pagamento na entrega (Cartão ou Dinheiro), dependendo da disponibilidade de cada estabelecimento."
      },
      {
        q: "O pagamento online é seguro?",
        a: "Sim! Utilizamos a infraestrutura do Asaas, um dos maiores processadores de pagamento do Brasil, garantindo criptografia de ponta a ponta em todas as transações."
      }
    ]
  },
  {
    category: "Conta e Segurança",
    icon: <ShieldCheck className="w-5 h-5" />,
    questions: [
      {
        q: "Como altero minha senha?",
        a: "Acesse seu perfil, vá em configurações e selecione a opção de alterar senha. Se esqueceu sua senha, use a opção 'Esqueci minha senha' na tela de login."
      },
      {
        q: "Como protegem meus dados?",
        a: "Seguimos rigorosamente a LGPD. Seus dados são utilizados apenas para processar seus pedidos e melhorar sua experiência na plataforma."
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
          <h3 className="font-bold text-lg mb-4">Canais de Atendimento</h3>
          
          <Card className="border-none shadow-soft bg-green-500/5 hover:bg-green-500/10 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-white">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Atendimento humano via chat</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white">
                <Headset className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Chat Interno</p>
                <p className="text-xs text-muted-foreground">Fale direto pelo aplicativo</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft bg-orange-500/5 hover:bg-orange-500/10 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">E-mail</p>
                <p className="text-xs text-muted-foreground">suporte@vaijadelivery.com</p>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
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
          <h3 className="font-bold text-lg mb-6">Perguntas Frequentes</h3>
          <div className="space-y-8">
            {faqs.map((cat, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-4 text-primary">
                  {cat.icon}
                  <h4 className="font-bold uppercase tracking-widest text-xs">{cat.category}</h4>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {cat.questions.map((q, qIdx) => (
                    <AccordionItem 
                      key={qIdx} 
                      value={`item-${idx}-${qIdx}`}
                      className="border rounded-2xl px-4 bg-card"
                    >
                      <AccordionTrigger className="hover:no-underline font-medium text-left">
                        {q.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
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
