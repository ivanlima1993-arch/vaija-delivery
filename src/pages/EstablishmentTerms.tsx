import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Building2, ShieldCheck, Scale, CreditCard, ShoppingBag, Clock, Ban } from "lucide-react";

const EstablishmentTerms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Termos de Uso para Estabelecimentos</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Diretrizes e normas para parceiros comerciais da plataforma Vai Já Delivery.
            </p>
          </div>
          
          <ScrollArea className="h-[600px] rounded-2xl border border-border bg-card p-6 md:p-10 shadow-sm">
            <div className="space-y-10 text-muted-foreground leading-relaxed">
              
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-xl border-l-4 border-primary pl-4">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <h2>1. Natureza da Parceria</h2>
                </div>
                <p>
                  O Presente Termo regula a relação entre o **Vai Já Delivery** e o **Estabelecimento Parceiro**. A plataforma atua exclusivamente como intermediária, conectando o estabelecimento ao consumidor final e, opcionalmente, ao serviço de logística de terceiros.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-xl border-l-4 border-primary pl-4">
                  <FileText className="w-6 h-6 text-primary" />
                  <h2>2. Cadastro e Documentação</h2>
                </div>
                <p>
                  Para operar na plataforma, o Estabelecimento deve fornecer:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>CNPJ ou CPF (conforme categoria de serviço) ativo e regular.</li>
                  <li>Dados bancários de mesma titularidade do cadastro.</li>
                  <li>Licença sanitária e alvará de funcionamento (quando aplicável).</li>
                  <li>Informações precisas de endereço e horários de funcionamento.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-xl border-l-4 border-primary pl-4">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                  <h2>3. Gestão de Cardápio e Preços</h2>
                </div>
                <p>
                  É de responsabilidade exclusiva do Estabelecimento:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Manter fotos reais e descrições fidedignas dos produtos.</li>
                  <li>Garantir que os preços na plataforma sejam competitivos ou iguais aos praticados no balcão.</li>
                  <li>Atualizar a disponibilidade de estoque em tempo real para evitar cancelamentos por falta de produtos.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-xl border-l-4 border-primary pl-4">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <h2>4. Taxas e Comissões</h2>
                </div>
                <p>
                  Pela intermediação e uso da tecnologia, o Vai Já Delivery cobrará uma porcentagem sobre o valor bruto de cada pedido realizado através da plataforma, conforme plano contratado pelo Estabelecimento.
                </p>
                <p>
                  O repasse dos valores (subtraída a comissão) será efetuado no prazo acordado (semanal/quinzenal/mensal) na conta bancária cadastrada.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-xl border-l-4 border-primary pl-4">
                  <Clock className="w-6 h-6 text-primary" />
                  <h2>5. Prazos de Preparo e Entrega</h2>
                </div>
                <p>
                  O Estabelecimento compromete-se a iniciar a preparação do pedido assim que aceito na plataforma. Atrasos sistemáticos podem resultar em queda de visibilidade no aplicativo ou suspensão temporária do cadastro devido ao impacto na experiência do cliente.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-xl border-l-4 border-primary pl-4">
                  <Scale className="w-6 h-6 text-primary" />
                  <h2>6. Responsabilidade Civil e Qualidade</h2>
                </div>
                <p>
                  O Estabelecimento é o único responsável pela qualidade, validade, temperatura e segurança alimentar dos itens fornecidos. O Vai Já Delivery não responde por danos causados ao consumidor decorrentes do consumo de produtos impróprios ou erro na montagem do pedido.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-xl border-l-4 border-primary pl-4">
                  <Ban className="w-6 h-6 text-primary" />
                  <h2>7. Regras de Cancelamento</h2>
                </div>
                <p>
                  Cancelamentos feitos pelo Estabelecimento após o pedido ser aceito devem ser justificados. Caso o cliente solicite cancelamento devido a atraso excessivo do Estabelecimento, este poderá arcar com os custos de estorno ao cliente.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-xl border-l-4 border-primary pl-4">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <h2>8. Sigilo e Proteção de Dados</h2>
                </div>
                <p>
                  O Estabelecimento não poderá utilizar os dados dos clientes (como telefone ou endereço) para fins diferentes da entrega do pedido específico, sendo proibido o marketing direto sem autorização expressa ou o compartilhamento de dados com terceiros (LGPD).
                </p>
              </section>

              <div className="pt-10 border-t border-border flex flex-col gap-2">
                <p className="font-bold text-foreground">Precisa de suporte comercial?</p>
                <p>WhatsApp: (79) 98832-0546</p>
                <p>Email: comercial@vaijadelivery.com.br</p>
                <p className="text-sm mt-4 text-muted-foreground italic">Atualizado em 24 de Abril de 2026</p>
              </div>

            </div>
          </ScrollArea>

          <div className="mt-8 text-center flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground italic">
                  Ao continuar com o seu cadastro, você está ciente e concorda com todos os termos acima.
              </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EstablishmentTerms;
