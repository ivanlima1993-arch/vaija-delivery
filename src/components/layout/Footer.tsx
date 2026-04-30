import { Zap, Instagram, Facebook, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface CityLinks {
  instagram_url?: string;
  facebook_url?: string;
}

const Footer = () => {
  const [cityLinks, setCityLinks] = useState<CityLinks>({});

  useEffect(() => {
    const fetchCityLinks = async () => {
      // Pega a cidade selecionada do localStorage (padrão da seleção do usuário)
      const selectedCityId = localStorage.getItem("selectedCityId");

      if (!selectedCityId) {
        // Se não tem cidade, busca a primeira cidade ativa
        const { data } = await supabase
          .from("cities")
          .select("instagram_url, facebook_url")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        if (data) setCityLinks(data);
        return;
      }

      const { data } = await supabase
        .from("cities")
        .select("instagram_url, facebook_url")
        .eq("id", selectedCityId)
        .maybeSingle();

      if (data) setCityLinks(data);
    };

    fetchCityLinks();
  }, []);

  return (
    <footer className="bg-secondary text-secondary-foreground mt-12">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img
                src={logo}
                alt="Vai Já Delivery"
                className="h-20 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Pediu, chegou. Vai Já! Os melhores estabelecimentos da sua cidade com entrega rápida.
            </p>
            <div className="flex gap-3">
              {cityLinks.instagram_url ? (
                <a
                  href={cityLinks.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center hover:bg-pink-500 transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              ) : (
                <span className="w-9 h-9 rounded-full bg-muted/10 flex items-center justify-center opacity-30 cursor-not-allowed" title="Instagram não configurado">
                  <Instagram className="w-4 h-4" />
                </span>
              )}
              {cityLinks.facebook_url ? (
                <a
                  href={cityLinks.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center hover:bg-blue-600 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              ) : (
                <span className="w-9 h-9 rounded-full bg-muted/10 flex items-center justify-center opacity-30 cursor-not-allowed" title="Facebook não configurado">
                  <Facebook className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>

          {/* Parceiros */}
          <div>
            <h4 className="font-display font-semibold mb-4">Parceiros</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/parceiros" className="hover:text-primary transition-colors text-primary font-medium flex items-center gap-1"><Zap className="w-3 h-3" /> Seja um Parceiro (Venda Conosco)</Link></li>
              <li><Link to="/estabelecimento/auth" className="hover:text-primary transition-colors">Cadastre seu estabelecimento</Link></li>
              <li><Link to="/entregador/auth" className="hover:text-primary transition-colors">Seja entregador</Link></li>
              <li><Link to="/profissional/auth" className="hover:text-primary transition-colors">Seja um profissional</Link></li>
              <li><Link to="/corretor/auth" className="hover:text-primary transition-colors font-bold text-emerald-600">Portal do Corretor</Link></li>
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h4 className="font-display font-semibold mb-4">Institucional</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/sobre-nos" className="hover:text-primary transition-colors">Sobre nós</Link></li>
              <li><Link to="/termos-de-uso" className="hover:text-primary transition-colors">Termos de uso</Link></li>
              <li><Link to="/termos-estabelecimento" className="hover:text-primary transition-colors">Termos para estabelecimentos</Link></li>
              <li><Link to="/politica-de-privacidade" className="hover:text-primary transition-colors">Política de privacidade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <a href="https://wa.me/5579988320546" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  (79) 98832-0546
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:vaijadeliveryoficial@gmail.com" className="hover:text-primary transition-colors">
                  vaijadeliveryoficial@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-muted/20 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2025 VAIJÁ DELIVERY. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-primary" />
            <span>Feito com velocidade no Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
