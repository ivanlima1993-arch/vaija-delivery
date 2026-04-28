import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  Wrench, 
  ArrowRight, 
  CheckCircle2, 
  Store, 
  TrendingUp, 
  Users, 
  ChevronLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";

export default function Partners() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "business",
    contact_info: "",
    city: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contact_info || !formData.city) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('prospects')
        .insert([{
          name: formData.name,
          type: formData.type,
          contact_info: formData.contact_info,
          city: formData.city,
          status: 'Novo',
          notes: 'Lead capturado pela Landing Page Pública.'
        }]);

      if (error) throw error;
      
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error('Error submitting lead:', error);
      toast.error("Ocorreu um erro ao enviar seu cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-lg"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Cadastro Recebido!</h1>
          <p className="text-muted-foreground mb-8">
            Muito obrigado pelo seu interesse em fazer parte do Vai Já Delivery. 
            Nossa equipe entrará em contato com você muito em breve pelo número fornecido!
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Voltar para a Página Inicial
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Simplificado */}
      <header className="p-4 md:p-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10 border-b">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        <div className="font-bold text-xl text-primary flex items-center gap-2">
          <Store className="w-6 h-6" />
          Vai Já Parceiros
        </div>
        <div className="w-20"></div> {/* Spacer */}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 p-4 md:p-8 items-center">
        
        {/* Lado Esquerdo - Copywriting / Benefícios */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Faça seu negócio <span className="text-primary">crescer</span> com o Vai Já Delivery
            </h1>
            <p className="text-lg text-muted-foreground">
              Junte-se a centenas de comércios e profissionais independentes que já estão aumentando suas vendas e alcançando novos clientes todos os dias.
            </p>
          </div>

          <div className="space-y-4">
            <Card className="border-none shadow-md bg-primary/5">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="bg-primary/20 p-2 rounded-lg mt-1">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Aumento de Vendas</h3>
                  <p className="text-muted-foreground text-sm">Alcance milhares de clientes na sua região que buscam seus produtos ou serviços.</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-md bg-primary/5">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="bg-primary/20 p-2 rounded-lg mt-1">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Gestão Simplificada</h3>
                  <p className="text-muted-foreground text-sm">Painel exclusivo para gerenciar seus pedidos, entregadores e pagamentos em um só lugar.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Lado Direito - Formulário */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-orange-400"></div>
            <CardContent className="p-6 md:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold">Dê o primeiro passo</h2>
                <p className="text-muted-foreground">Preencha seus dados e nossa equipe entrará em contato com a melhor proposta.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Qual é o seu perfil?</Label>
                  <RadioGroup 
                    defaultValue="business" 
                    value={formData.type}
                    onValueChange={(v) => setFormData({...formData, type: v})}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="business" id="business" className="peer sr-only" />
                      <Label
                        htmlFor="business"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Building2 className="mb-3 h-6 w-6" />
                        Comércio
                        <span className="text-[10px] text-muted-foreground font-normal mt-1">Restaurante, Loja...</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="person" id="person" className="peer sr-only" />
                      <Label
                        htmlFor="person"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Wrench className="mb-3 h-6 w-6" />
                        Profissional
                        <span className="text-[10px] text-muted-foreground font-normal mt-1">Prestador, Freelancer...</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome do {formData.type === 'business' ? 'Comércio' : 'Profissional'}</Label>
                  <Input 
                    id="name" 
                    placeholder={formData.type === 'business' ? "Ex: Pizzaria do João" : "Ex: João Silva - Encanador"} 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">WhatsApp</Label>
                    <Input 
                      id="contact" 
                      placeholder="(00) 00000-0000" 
                      value={formData.contact_info}
                      onChange={(e) => setFormData({...formData, contact_info: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input 
                      id="city" 
                      placeholder="Ex: São Paulo" 
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full gap-2 text-lg" disabled={loading}>
                  {loading ? "Enviando..." : "Quero ser Parceiro"}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Ao enviar, você concorda com nossos Termos de Uso e Política de Privacidade.
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
