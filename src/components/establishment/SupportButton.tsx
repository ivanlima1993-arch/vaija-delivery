import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Headset, 
  MessageCircle, 
  Mail, 
  MessageSquare,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export const SupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [settings, setSettings] = useState({
    whatsapp: "5579988320546",
    email: "suporte@vaijadelivery.com",
    chatUrl: "",
    days: ["1", "2", "3", "4", "5"],
    startTime: "08:00",
    endTime: "22:00",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const checkOnline = () => {
      const now = new Date();
      const day = now.getDay().toString();
      const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });

      const isWorkingDay = settings.days.includes(day);
      const isWorkingTime = time >= settings.startTime && time <= settings.endTime;

      setIsOnline(isWorkingDay && isWorkingTime);
    };

    checkOnline();
    const interval = setInterval(checkOnline, 60000);
    return () => clearInterval(interval);
  }, [settings]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "support")
        .maybeSingle();

      if (data) {
        setSettings(prev => ({ ...prev, ...data.value }));
      }
    } catch (error) {
      console.error("Error fetching support settings:", error);
    }
  };

  const supportOptions = [
    {
      icon: <MessageCircle className="w-5 h-5 text-green-500" />,
      label: "WhatsApp",
      description: isOnline ? "Atendimento imediato" : "Responderemos em breve",
      href: `https://wa.me/${settings.whatsapp}`,
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
      label: "Chat Online",
      description: isOnline ? "Converse agora" : "Indisponível no momento",
      href: settings.chatUrl || "#",
      disabled: !isOnline,
      onClick: () => settings.chatUrl && window.open(settings.chatUrl, "_blank"),
    },
    {
      icon: <Mail className="w-5 h-5 text-orange-500" />,
      label: "E-mail",
      description: "Envie sua dúvida",
      href: `mailto:${settings.email}`,
    },
  ];

  const getDayLabel = (d: string) => {
    const labels: Record<string, string> = {
      "0": "Dom", "1": "Seg", "2": "Ter", "3": "Qua", "4": "Qui", "5": "Sex", "6": "Sáb"
    };
    return labels[d];
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className={`rounded-full h-14 w-14 shadow-2xl transition-all duration-300 group relative ${
              isOnline ? "bg-primary hover:bg-primary/90" : "bg-muted-foreground hover:bg-muted-foreground/90"
            }`}
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <Headset className="w-7 h-7 text-white" />
            </motion.div>
            
            {/* Online/Offline Status Indicator */}
            <span className={`absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-background ${
              isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`} />

            <span className="sr-only">Suporte</span>
            
            <span className="absolute right-16 px-3 py-1 bg-background border rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:block whitespace-nowrap text-foreground pointer-events-none font-medium">
              {isOnline ? "Suporte Online" : "Suporte Offline"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-72 p-2 mb-4">
          <DropdownMenuLabel className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg font-bold text-foreground">Suporte Vai Já</span>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-600 animate-pulse" : "bg-gray-400"}`} />
                {isOnline ? "Online" : "Offline"}
              </div>
            </div>
            <span className="text-sm font-normal text-muted-foreground leading-relaxed">
              {isOnline 
                ? "Como podemos ajudar você agora?" 
                : "Estamos fora do horário comercial, mas você ainda pode nos enviar uma mensagem."}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {supportOptions.map((option) => (
            <DropdownMenuItem
              key={option.label}
              className={`p-3 cursor-pointer focus:bg-primary/5 rounded-xl transition-all ${
                option.disabled ? "opacity-50 grayscale pointer-events-none" : ""
              }`}
              asChild
            >
              <a
                href={option.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={option.onClick}
                className="flex items-center gap-4 w-full"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {option.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </a>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <div className="p-3 flex items-start gap-2 bg-muted/30 rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Horário de Atendimento
              </p>
              <p className="text-xs font-medium text-foreground">
                {settings.days.map(d => getDayLabel(d)).join(", ")}
              </p>
              <p className="text-xs text-muted-foreground">
                Das {settings.startTime} às {settings.endTime}
              </p>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
