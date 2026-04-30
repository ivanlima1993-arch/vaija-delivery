import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    FileText, Building, ShieldCheck, Scale, 
    MessageCircle, Image as ImageIcon, Search, Ban 
} from "lucide-react";

const RealtorTerms = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            
            <main className="flex-1 container py-8 md:py-16">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col items-center text-center mb-12">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                            <Building className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase italic tracking-tighter">
                            Termos de Uso do Portal do Corretor
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-2xl font-medium">
                            Diretrizes para corretores de imóveis e imobiliárias parceiras da plataforma Vai Já Imóveis.
                        </p>
                    </div>
                    
                    <ScrollArea className="h-[600px] rounded-[2.5rem] border border-border bg-card p-8 md:p-12 shadow-soft">
                        <div className="space-y-12 text-muted-foreground leading-relaxed font-medium">
                            
                            <section className="space-y-4">
                                <div className="flex items-center gap-3 text-foreground font-black text-xl border-l-4 border-emerald-500 pl-4 uppercase italic tracking-tight">
                                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                    <h2>1. Qualificação Profissional</h2>
                                </div>
                                <p>
                                    O uso do Portal do Corretor é exclusivo para profissionais devidamente registrados no **CRECI (Conselho Regional de Corretores de Imóveis)** com status ativo e regular. A plataforma realiza a validação manual de cada cadastro. O uso de registros falsos ou de terceiros resultará em banimento imediato e denúncia aos órgãos competentes.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3 text-foreground font-black text-xl border-l-4 border-emerald-500 pl-4 uppercase italic tracking-tight">
                                    <FileText className="w-6 h-6 text-emerald-600" />
                                    <h2>2. Veracidade dos Anúncios</h2>
                                </div>
                                <p>
                                    O Corretor é o único responsável pela veracidade das informações publicadas. É obrigatório:
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Informar o valor real de venda ou aluguel.</li>
                                    <li>Manter a disponibilidade do imóvel atualizada (imóveis vendidos ou alugados devem ser removidos em até 24h).</li>
                                    <li>Descrever precisamente o estado de conservação e características técnicas.</li>
                                    <li>Possuir autorização expressa do proprietário para anunciar o imóvel.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3 text-foreground font-black text-xl border-l-4 border-emerald-500 pl-4 uppercase italic tracking-tight">
                                    <ImageIcon className="w-6 h-6 text-emerald-600" />
                                    <h2>3. Qualidade Visual e Conteúdo</h2>
                                </div>
                                <p>
                                    Para manter o padrão premium da plataforma, o corretor compromete-se a:
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Utilizar fotos de alta resolução, sem marcas d'água de outros portais concorrentes.</li>
                                    <li>Não utilizar imagens ilustrativas para imóveis prontos.</li>
                                    <li>Evitar textos em caixa alta (CAPS LOCK) excessiva ou símbolos que poluam a leitura.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3 text-foreground font-black text-xl border-l-4 border-emerald-500 pl-4 uppercase italic tracking-tight">
                                    <MessageCircle className="w-6 h-6 text-emerald-600" />
                                    <h2>4. Gestão de Leads e Contatos</h2>
                                </div>
                                <p>
                                    Ao receber um interesse (Lead) através da plataforma, o corretor concorda que:
                                </p>
                                <p>
                                    Os dados do cliente (nome e telefone) devem ser utilizados exclusivamente para o atendimento relativo ao imóvel solicitado ou prospecção imobiliária direta. É proibido o compartilhamento desses dados com terceiros ou o uso para spam. O tempo de resposta esperado é de até 24 horas úteis.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3 text-foreground font-black text-xl border-l-4 border-emerald-500 pl-4 uppercase italic tracking-tight">
                                    <Scale className="w-6 h-6 text-emerald-600" />
                                    <h2>5. Transações e Comissões</h2>
                                </div>
                                <p>
                                    A Vai Já Imóveis atua como um portal de classificados e geração de leads. **Não participamos, não garantimos e não recebemos comissões sobre as transações imobiliárias** realizadas entre o corretor e o cliente. Toda a negociação, contrato e recebimento de honorários é de responsabilidade direta e exclusiva do Corretor/Imobiliária.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3 text-foreground font-black text-xl border-l-4 border-emerald-500 pl-4 uppercase italic tracking-tight">
                                    <Ban className="w-6 h-6 text-emerald-600" />
                                    <h2>6. Condutas Proibidas</h2>
                                </div>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Anunciar imóveis inexistentes ou "iscas".</li>
                                    <li>Publicar o mesmo imóvel repetidas vezes (Duplicidade).</li>
                                    <li>Utilizar linguajar ofensivo ou discriminatório.</li>
                                    <li>Tentar burlar os sistemas de segurança da plataforma.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3 text-foreground font-black text-xl border-l-4 border-emerald-500 pl-4 uppercase italic tracking-tight">
                                    <Search className="w-6 h-6 text-emerald-600" />
                                    <h2>7. Modificações e Suspensão</h2>
                                </div>
                                <p>
                                    A Vai Já reserva-se o direito de remover anúncios que violem estes termos sem aviso prévio. Em caso de reincidência, a conta do corretor será suspensa permanentemente. Estes termos podem ser atualizados periodicamente para refletir melhorias no serviço.
                                </p>
                            </section>

                            <div className="pt-10 border-t border-border flex flex-col gap-2 bg-emerald-50/50 p-8 rounded-3xl">
                                <p className="font-black text-foreground uppercase italic tracking-tight">Suporte ao Corretor</p>
                                <p>WhatsApp: (79) 98832-0546</p>
                                <p>Email: imoveis@vaija.com.br</p>
                                <p className="text-xs mt-4 text-muted-foreground font-bold uppercase tracking-widest">Atualizado em 30 de Abril de 2026</p>
                            </div>

                        </div>
                    </ScrollArea>

                    <div className="mt-8 text-center flex flex-col items-center gap-4">
                        <p className="text-sm text-muted-foreground font-medium italic">
                            Ao prosseguir com seu cadastro e anúncio, você declara ter lido e aceito integralmente estes termos.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default RealtorTerms;
