import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, TrendingUp, Users, CheckCircle, ArrowRight, Loader2, Send, LogIn } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
    } catch (err: any) {
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
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background -z-10" />
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 border border-primary/20">
                  Expansão Vai Já Delivery
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display tracking-tight leading-tight mb-6">
                  Seja dono do <span className="text-primary">aplicativo</span> na sua cidade!
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Torne-se um franqueado e lucre com o mercado de delivery na sua região. Operação simplificada, tecnologia de ponta e suporte completo.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full" onClick={() => document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' })}>
                    Quero ser Franqueado
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-lg rounded-full border-primary/40 text-primary hover:bg-primary/5"
                    onClick={() => navigate("/franqueado/auth")}
                  >
                    <LogIn className="mr-2 w-5 h-5" />
                    Já sou Franqueado
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="aspect-square bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl p-8 relative">
                  <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/20" />
                  <div className="relative h-full flex flex-col justify-center gap-6">
                    <div className="bg-card p-6 rounded-2xl shadow-xl flex items-center gap-4 animate-float">
                      <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Faturamento Médio</p>
                        <p className="text-2xl font-black">R$ 15.000<span className="text-sm text-muted-foreground font-normal">/mês</span></p>
                      </div>
                    </div>
                    <div className="bg-card p-6 rounded-2xl shadow-xl flex items-center gap-4 animate-float" style={{ animationDelay: '1s' }}>
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Exclusividade</p>
                        <p className="text-xl font-black">1 por Cidade</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-secondary/30">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-black font-display mb-4">Por que escolher o Vai Já?</h2>
              <p className="text-muted-foreground">O mercado de delivery não para de crescer. Oferecemos a tecnologia e você foca em cadastrar os restaurantes locais.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: TrendingUp,
                  title: "Alta Lucratividade",
                  description: "Ganhe um percentual sobre todas as vendas realizadas pelo app na sua cidade."
                },
                {
                  icon: Users,
                  title: "Gestão Local",
                  description: "Você gerencia os restaurantes, entregadores e cupons da sua região com total autonomia."
                },
                {
                  icon: CheckCircle,
                  title: "Tecnologia Pronta",
                  description: "Não gaste com programação. Aplicativo rápido, moderno e pronto para usar."
                }
              ].map((benefit, i) => (
                <div key={i} className="bg-card p-8 rounded-3xl shadow-soft border border-border/50 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                    <benefit.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section id="form" className="py-20">
          <div className="container max-w-3xl">
            <div className="bg-card rounded-[40px] shadow-xl border border-border p-8 md:p-12">
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
                    <h2 className="text-3xl font-black font-display mb-4">Demonstre Interesse</h2>
                    <p className="text-muted-foreground">Preencha os dados abaixo e nossa equipe entrará em contato para apresentar o plano de negócios completo.</p>
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome Completo</label>
                        <Input
                          name="full_name"
                          placeholder="Seu nome"
                          className="h-12"
                          required
                          value={formData.full_name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">E-mail</label>
                        <Input
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="h-12"
                          required
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Telefone / WhatsApp</label>
                        <Input
                          name="phone"
                          placeholder="(00) 00000-0000"
                          className="h-12"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cidade de Interesse</label>
                        <Input
                          name="city"
                          placeholder="Ex: Aracaju - SE"
                          className="h-12"
                          required
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
                          Enviar Solicitação
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
