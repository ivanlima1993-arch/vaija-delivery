import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Mail,
  MessageSquare,
  Clock,
  X,
  Headset,
  Send,
  ChevronDown,
  Smile,
  Paperclip,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  from: "user" | "support";
  text: string;
  time: string;
}

const QUICK_REPLIES = [
  "Como faço um pedido?",
  "Quero cancelar meu pedido",
  "Problema com pagamento",
  "Prazo de entrega",
];

export const SupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"menu" | "chat">("menu");
  const [isOnline, setIsOnline] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      from: "support",
      text: "Olá! 👋 Sou o assistente do Vai Já. Como posso te ajudar hoje?",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [settings, setSettings] = useState({
    whatsapp: "5579988320546",
    email: "suporte@vaijadelivery.com",
    chatUrl: "",
    days: ["1", "2", "3", "4", "5"],
    startTime: "08:00",
    endTime: "22:00",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    const checkOnline = () => {
      const now = new Date();
      const day = now.getDay().toString();
      const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });
      setIsOnline(settings.days.includes(day) && time >= settings.startTime && time <= settings.endTime);
    };
    checkOnline();
    const interval = setInterval(checkOnline, 60000);
    return () => clearInterval(interval);
  }, [settings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from("site_settings").select("*").eq("key", "support").maybeSingle();
      if (data) setSettings(prev => ({ ...prev, ...data.value }));
    } catch (e) {
      console.error("Error fetching support settings:", e);
    }
  };

  const getDayLabel = (d: string) => ({ "0": "Dom", "1": "Seg", "2": "Ter", "3": "Qua", "4": "Qui", "5": "Sex", "6": "Sáb" }[d] ?? d);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { id: Date.now().toString(), from: "user", text: text.trim(), time: now };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");

    // Auto-reply after 1.5s
    setTimeout(() => {
      const replies = [
        "Entendido! Vou verificar isso para você. 🔍",
        "Obrigado pelo contato. Nossa equipe está analisando sua solicitação.",
        "Você também pode nos contatar pelo WhatsApp para atendimento mais rápido! 📱",
        "Certo! Para questões urgentes, recomendo usar nosso WhatsApp: (79) 98832-0546.",
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), from: "support", text: reply, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
      ]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-[340px] rounded-3xl shadow-2xl overflow-hidden border border-white/10 bg-card flex flex-col"
            style={{ maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Headset className="w-5 h-5 text-white" />
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-primary ${isOnline ? "bg-green-400" : "bg-gray-400"}`} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Suporte Vai Já</p>
                  <p className={`text-[11px] font-medium ${isOnline ? "text-green-300" : "text-white/60"}`}>
                    {isOnline ? "● Online agora" : "○ Fora do horário"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Tab switcher */}
                <button
                  onClick={() => setTab("menu")}
                  className={`p-1.5 rounded-xl transition-colors ${tab === "menu" ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10"}`}
                  title="Canais"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTab("chat")}
                  className={`p-1.5 rounded-xl transition-colors ${tab === "chat" ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10"}`}
                  title="Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab: Menu */}
            <AnimatePresence mode="wait">
              {tab === "menu" && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col"
                >
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest px-1">Fale com a gente</p>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/${settings.whatsapp}?text=Olá, preciso de ajuda!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-2xl bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 hover:border-green-500/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">WhatsApp</p>
                        <p className="text-xs text-muted-foreground">{isOnline ? "Atendimento imediato" : "Responderemos em breve"}</p>
                      </div>
                      <span className="text-xs text-green-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Abrir →</span>
                    </a>

                    {/* Chat Online */}
                    <button
                      onClick={() => setTab("chat")}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/10 hover:border-primary/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-bold text-sm text-foreground">Chat Online</p>
                        <p className="text-xs text-muted-foreground">{isOnline ? "Converse agora" : "Deixe sua mensagem"}</p>
                      </div>
                      <span className="text-xs text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">Abrir →</span>
                    </button>

                    {/* E-mail */}
                    <a
                      href={`mailto:${settings.email}`}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/10 hover:border-orange-500/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">E-mail</p>
                        <p className="text-xs text-muted-foreground truncate">{settings.email}</p>
                      </div>
                      <span className="text-xs text-orange-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Abrir →</span>
                    </a>
                  </div>

                  {/* Hours */}
                  <div className="mx-4 mb-4 p-3 rounded-2xl bg-muted/40 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Horário de Atendimento</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">
                        {settings.days.map(d => getDayLabel(d)).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">Das {settings.startTime} às {settings.endTime}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab: Chat */}
              {tab === "chat" && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex flex-col flex-1"
                  style={{ height: "400px" }}
                >
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.from === "support" && (
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center mr-2 mt-1 shrink-0">
                            <Headset className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div className={`max-w-[75%] flex flex-col ${msg.from === "user" ? "items-end" : "items-start"}`}>
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                              msg.from === "user"
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-card border border-border text-foreground rounded-bl-sm shadow-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick replies */}
                  <div className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-border/50">
                    {QUICK_REPLIES.map((r) => (
                      <button
                        key={r}
                        onClick={() => sendMessage(r)}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors font-semibold whitespace-nowrap"
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-border/50 bg-card flex items-center gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 text-sm bg-muted/50 rounded-2xl px-4 py-2.5 border-0 outline-none focus:ring-2 focus:ring-primary/20 font-medium placeholder:text-muted-foreground/60"
                    />
                    <Button
                      size="icon"
                      className="h-9 w-9 rounded-xl shrink-0 bg-primary hover:bg-primary/90"
                      onClick={() => sendMessage(inputValue)}
                      disabled={!inputValue.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-colors ${
          isOpen ? "bg-muted text-foreground" : isOnline ? "bg-primary text-white" : "bg-muted-foreground/80 text-white"
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Online pulse */}
        {!isOpen && (
          <span className={`absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${isOnline ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
        )}

        {/* Tooltip */}
        {!isOpen && (
          <span className="absolute right-16 px-3 py-1.5 bg-card border border-border rounded-xl shadow-lg opacity-0 hover:opacity-0 pointer-events-none whitespace-nowrap text-foreground text-sm font-semibold hidden md:group-hover:block">
            {isOnline ? "Suporte Online" : "Suporte Offline"}
          </span>
        )}
      </motion.button>
    </div>
  );
};
