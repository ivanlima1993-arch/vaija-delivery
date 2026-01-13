import { Zap, Instagram, Facebook, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-12">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">VJ</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">VAIJÁ</h3>
                <p className="text-xs text-muted-foreground">DELIVERY</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Pediu, chegou. Vai Já! Os melhores estabelecimentos da sua cidade com entrega rápida.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Para você</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Como funciona</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Cupons</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Suporte</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Parceiros</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Cadastre seu restaurante</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Seja entregador</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Portal do parceiro</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>(11) 99999-9999</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>contato@vaija.delivery</span>
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
