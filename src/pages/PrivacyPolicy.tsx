import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-6">Política de Privacidade</h1>
          
          <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Introdução</h2>
              <p>
                A sua privacidade é importante para nós. Esta Política de Privacidade descreve como o Vai Já Delivery coleta, usa, armazena e protege suas informações pessoais quando você utiliza nossa plataforma e serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Informações que Coletamos</h2>
              <p>Podemos coletar as seguintes informações:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Dados de identificação:</strong> nome completo, CPF, e-mail e telefone</li>
                <li><strong>Dados de localização:</strong> endereço de entrega e coordenadas GPS (quando autorizado)</li>
                <li><strong>Dados de pagamento:</strong> informações necessárias para processar transações</li>
                <li><strong>Dados de uso:</strong> histórico de pedidos, preferências e interações com a plataforma</li>
                <li><strong>Dados do dispositivo:</strong> modelo, sistema operacional e identificadores únicos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Como Usamos suas Informações</h2>
              <p>Utilizamos suas informações para:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Processar e entregar seus pedidos</li>
                <li>Comunicar sobre status de pedidos e atualizações</li>
                <li>Melhorar nossos serviços e experiência do usuário</li>
                <li>Personalizar recomendações e ofertas</li>
                <li>Prevenir fraudes e garantir a segurança da plataforma</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Compartilhamento de Dados</h2>
              <p>Podemos compartilhar suas informações com:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Estabelecimentos parceiros:</strong> para preparação e entrega de pedidos</li>
                <li><strong>Entregadores:</strong> para realização das entregas</li>
                <li><strong>Processadores de pagamento:</strong> para efetuar transações financeiras</li>
                <li><strong>Autoridades:</strong> quando exigido por lei ou ordem judicial</li>
              </ul>
              <p className="mt-2">
                Não vendemos suas informações pessoais a terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Segurança dos Dados</h2>
              <p>
                Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia de dados, controles de acesso e monitoramento contínuo de segurança.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Seus Direitos (LGPD)</h2>
              <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Confirmar a existência de tratamento de seus dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão de dados desnecessários</li>
                <li>Solicitar a portabilidade dos dados</li>
                <li>Revogar consentimento a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Cookies e Tecnologias</h2>
              <p>
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso da plataforma e personalizar conteúdo. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Retenção de Dados</h2>
              <p>
                Mantemos suas informações pelo tempo necessário para fornecer nossos serviços e cumprir obrigações legais. Após este período, os dados serão excluídos ou anonimizados de forma segura.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas através da plataforma ou por e-mail. Recomendamos que você revise esta política regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Contato</h2>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em contato conosco:
              </p>
              <ul className="list-none mt-2 space-y-1">
                <li><strong>WhatsApp:</strong> (79) 98832-0546</li>
                <li><strong>E-mail:</strong> vaijadeliveryoficial@gmail.com</li>
              </ul>
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

export default PrivacyPolicy;
