import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Zap, Users, MapPin, Clock, Heart, Shield } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Sobre o <span className="text-primary">Vai Já Delivery</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Conectando você aos melhores estabelecimentos da sua cidade com rapidez, 
                qualidade e a conveniência que você merece.
              </p>
            </div>
          </div>
        </section>

        {/* Nossa História */}
        <section className="py-16 container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-display font-bold mb-6 text-center">Nossa História</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
              <p>
                O Vai Já Delivery nasceu da vontade de transformar a forma como as pessoas 
                pedem delivery em suas cidades. Percebemos que havia uma lacuna entre os 
                consumidores e os estabelecimentos locais, e decidimos criar uma ponte que 
                beneficiasse a todos.
              </p>
              <p>
                Nossa missão é simples: entregar felicidade na porta da sua casa. Seja aquela 
                pizza quentinha no domingo à noite, o almoço no escritório ou aquele lanche 
                especial, estamos aqui para tornar sua experiência mais prática e saborosa.
              </p>
              <p>
                Trabalhamos incansavelmente para apoiar os negócios locais, criar oportunidades 
                para entregadores e oferecer aos nossos clientes a melhor experiência de delivery 
                possível.
              </p>
            </div>
          </div>
        </section>

        {/* Nossos Valores */}
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <h2 className="text-2xl font-display font-bold mb-10 text-center">Nossos Valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Rapidez</h3>
                <p className="text-sm text-muted-foreground">
                  Entregamos seu pedido com agilidade, respeitando seu tempo e garantindo 
                  que sua comida chegue sempre fresca.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Qualidade</h3>
                <p className="text-sm text-muted-foreground">
                  Selecionamos cuidadosamente nossos parceiros para garantir que você 
                  receba sempre o melhor.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Comunidade</h3>
                <p className="text-sm text-muted-foreground">
                  Valorizamos os negócios locais e criamos oportunidades de renda para 
                  entregadores da região.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Segurança</h3>
                <p className="text-sm text-muted-foreground">
                  Seus dados e pagamentos são protegidos com as melhores práticas de 
                  segurança do mercado.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Cobertura</h3>
                <p className="text-sm text-muted-foreground">
                  Expandindo constantemente para levar nosso serviço a mais bairros e 
                  cidades.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Disponibilidade</h3>
                <p className="text-sm text-muted-foreground">
                  Estamos prontos para atender você nos horários que mais precisa, 
                  inclusive aos finais de semana.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-display font-bold mb-4">
              Faça parte dessa história
            </h2>
            <p className="text-muted-foreground mb-8">
              Seja como cliente, estabelecimento parceiro ou entregador, você é parte 
              fundamental do nosso sucesso. Juntos, estamos revolucionando o delivery local.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://wa.me/5579988320546" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Fale Conosco
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
