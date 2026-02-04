import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-6">Termos de Uso</h1>
          
          <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e utilizar a plataforma Vai Já Delivery, você concorda em cumprir e estar vinculado aos presentes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Descrição do Serviço</h2>
              <p>
                O Vai Já Delivery é uma plataforma que conecta usuários a estabelecimentos comerciais, facilitando a realização de pedidos e entregas. Atuamos como intermediários entre consumidores, estabelecimentos parceiros e entregadores.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Cadastro e Conta</h2>
              <p>
                Para utilizar nossos serviços, você deve criar uma conta fornecendo informações precisas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Uso da Plataforma</h2>
              <p>Ao utilizar nossa plataforma, você concorda em:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Fornecer informações verdadeiras e precisas</li>
                <li>Não utilizar o serviço para fins ilegais</li>
                <li>Não interferir no funcionamento da plataforma</li>
                <li>Respeitar os direitos de outros usuários</li>
                <li>Manter suas informações de contato atualizadas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Pedidos e Pagamentos</h2>
              <p>
                Os preços dos produtos são definidos pelos estabelecimentos parceiros. O Vai Já Delivery não se responsabiliza por alterações de preços ou disponibilidade de produtos. Os pagamentos são processados de forma segura através de nossos parceiros de pagamento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Entregas</h2>
              <p>
                Os prazos de entrega são estimativas e podem variar conforme demanda, condições climáticas e trânsito. Não nos responsabilizamos por atrasos causados por fatores externos ao nosso controle.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Cancelamentos e Reembolsos</h2>
              <p>
                Pedidos podem ser cancelados antes do início da preparação. Após este momento, o cancelamento está sujeito às políticas do estabelecimento. Reembolsos serão processados conforme o método de pagamento utilizado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Limitação de Responsabilidade</h2>
              <p>
                O Vai Já Delivery não se responsabiliza pela qualidade dos produtos fornecidos pelos estabelecimentos parceiros. Problemas com produtos devem ser reportados diretamente através da plataforma para análise.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Modificações dos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação na plataforma. O uso continuado dos serviços após tais alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Contato</h2>
              <p>
                Para dúvidas sobre estes Termos de Uso, entre em contato conosco através do WhatsApp (79) 98832-0546 ou pelo e-mail vaijadeliveryoficial@gmail.com.
              </p>
            </section>

            <p className="text-sm text-muted-foreground pt-4 border-t">
              Última atualização: Fevereiro de 2025
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfUse;
