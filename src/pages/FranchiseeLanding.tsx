import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle, ArrowRight, Loader2, Send, LogIn, Smartphone, Handshake } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import franchiseeBackground from "@/assets/franchisee-background.jpg";

const FranchiseeLanding = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.phone || !formData.city) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("franchise_leads")
        .insert([{
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          status: "Novo",
        }]);

      if (error) throw error;

      setSubmitted(true);
      toast.success("Solicitação enviada com sucesso! Em breve entraremos em contato.");
      setFormData({ full_name: "", email: "", phone: "", city: "" });
    } catch (err: unknown) {
      console.error("Erro ao enviar formulário:", err);
      toast.error("Erro ao enviar sua solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-slate-950 text-white">
          <img
            src={franchiseeBackground}
            alt="Franqueado Vai Já Delivery em uma rua comercial"
            className="absolute inset-x-0 top-8 h-[340px] w-full object-cover object-[70%_38%] md:inset-0 md:h-full md:object-[65%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-slate-950/75 to-slate-950 md:bg-gradient-to-r md:from-black/90 md:via-black/70 md:to-black/10" />

          <div className="container relative grid min-h-[720px] items-center gap-8 pb-14 pt-[350px] sm:pt-[380px] md:min-h-[680px] md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                <MapPin className="h-4 w-4 text-primary" />
                Expansão Vai Já Delivery
              </span>
              <h1 className="mb-6 font-display text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Leve o <span className="text-primary">Vai Já</span> para a sua cidade.
              </h1>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
                Construa uma operação local com tecnologia para conectar clientes, comércios e entregadores — com a sua experiência da região no centro do negócio.
              </p>

              <ul className="mb-9 grid gap-3 text-sm text-white/90 sm:text-base">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                  Plataforma pronta para apoiar a operação
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                  Gestão de parceiros e ações na sua região
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                  Orientação da equipe para conhecer cada etapa
                </li>
              </ul>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="xl"
                  className="rounded-full px-7"
                  onClick={() => document.getElementById("form")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Quero conversar sobre a franquia
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="rounded-full border-white/40 bg-white/5 px-7 text-white hover:bg-white/15 hover:text-white"
                  onClick={() => navigate("/franqueado/auth")}
                >
                  <LogIn className="h-5 w-5" />
                  Já sou franqueado
                </Button>
              </div>
              <p className="mt-4 text-sm text-white/65">
                Converse com nossa equipe e conheça o modelo, sem compromisso.
              </p>
            </motion.div>
            <div aria-hidden="true" className="hidden md:block" />
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white py-20 text-slate-900">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="mb-3 inline-block text-sm font-bold uppercase tracking-[0.16em] text-primary">Uma parceria local</span>
              <h2 className="mb-4 font-display text-3xl font-black sm:text-4xl">Uma estrutura para você começar com mais clareza.</h2>
              <p className="text-slate-600">Conheça os recursos e o acompanhamento disponíveis para desenvolver a operação Vai Já na sua região.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Smartphone,
                  title: "Tecnologia pronta",
                  description: "Uma plataforma para aproximar clientes, estabelecimentos e entregadores em um só lugar."
                },
                {
                  icon: MapPin,
                  title: "Conhecimento da região",
                  description: "Desenvolva sua presença local e construa relações com os comércios da sua cidade."
                },
                {
                  icon: Handshake,
                  title: "Acompanhamento próximo",
                  description: "Converse com a equipe Vai Já para entender a implantação, a operação e os próximos passos."
                }
              ].map((benefit, i) => (
                <div key={i} className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft transition-transform hover:-translate-y-1">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <benefit.icon className="w-8 h-8" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{benefit.title}</h3>
                  <p className="leading-relaxed text-slate-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section id="form" className="scroll-mt-24 bg-slate-50 py-20">
          <div className="container max-w-3xl">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 md:p-12">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-success" />
                  </div>
                  <h2 className="text-3xl font-black font-display mb-4">Solicitação Enviada!</h2>
                  <p className="text-muted-foreground text-lg mb-8">
                    Recebemos sua solicitação com sucesso. Nossa equipe entrará em contato em breve para apresentar o plano de negócios completo.
                  </p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Enviar outra solicitação
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="text-center mb-10">
                    <span className="mb-3 inline-block text-sm font-bold uppercase tracking-[0.16em] text-primary">Próximo passo</span>
                    <h2 className="mb-4 font-display text-3xl font-black sm:text-4xl">Vamos conversar sobre a sua cidade?</h2>
                    <p className="text-slate-600">Deixe seus dados. Nossa equipe entrará em contato para apresentar o modelo e responder às suas dúvidas.</p>
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="full_name" className="text-sm font-medium">Nome completo</label>
                        <Input
                          id="full_name"
                          name="full_name"
                          placeholder="Seu nome"
                          className="h-12"
                          required
                          autoComplete="name"
                          value={formData.full_name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">E-mail</label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="h-12"
                          required
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">Telefone / WhatsApp</label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          className="h-12"
                          required
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="city" className="text-sm font-medium">Cidade de interesse</label>
                        <Input
                          id="city"
                          name="city"
                          placeholder="Ex: Aracaju - SE"
                          className="h-12"
                          required
                          autoComplete="address-level2"
                          value={formData.city}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 text-lg mt-4 gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Quero receber informações
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FranchiseeLanding;
