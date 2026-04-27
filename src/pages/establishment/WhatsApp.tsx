import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { MessageCircle, Save, QrCode, RefreshCcw, CheckCircle2, AlertCircle, Menu as MenuIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EstablishmentWhatsApp = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isEstablishment } = useAuth();
  const [establishment, setEstablishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    whatsapp_enabled: false,
    whatsapp_welcome_message: "",
    whatsapp_closing_message: "",
    whatsapp_status: "disconnected",
  });

  useEffect(() => {
    if (!authLoading && (!user || !isEstablishment)) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchEstablishment();
    }
  }, [user, authLoading, isEstablishment, navigate]);

  const fetchEstablishment = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEstablishment(data);
        setFormData({
          whatsapp_enabled: data.whatsapp_enabled || false,
          whatsapp_welcome_message: data.whatsapp_welcome_message || "",
          whatsapp_closing_message: data.whatsapp_closing_message || "",
          whatsapp_status: data.whatsapp_status || "disconnected",
        });
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!establishment) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("establishments")
        .update({
          whatsapp_enabled: formData.whatsapp_enabled,
          whatsapp_welcome_message: formData.whatsapp_welcome_message,
          whatsapp_closing_message: formData.whatsapp_closing_message,
        })
        .eq("id", establishment.id);

      if (error) throw error;

      toast.success("Configurações do WhatsApp salvas!");
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQR = () => {
    // This will be integrated with the Evolution API later
    // For now, it's a demonstration of the UI
    toast.info("Conectando com o servidor de WhatsApp...");
    setFormData(prev => ({ ...prev, whatsapp_status: "pairing" }));
    
    // Simulating QR Code generation
    setTimeout(() => {
      setQrCode("https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=vaija-delivery-mock-connection");
    }, 2000);
  };

  const disconnectWhatsApp = () => {
    setFormData(prev => ({ ...prev, whatsapp_status: "disconnected" }));
    setQrCode(null);
    toast.success("WhatsApp desconectado");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <EstablishmentSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                WhatsApp Chatbot
              </h1>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
          {/* Main Status */}
          <Card className="overflow-hidden border-green-100 bg-gradient-to-br from-white to-green-50/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-lg font-bold">Chatbot Ativo</Label>
                    <AnimatePresence mode="wait">
                      {formData.whatsapp_status === 'connected' ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3 h-3" /> CONECTADO
                        </motion.div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold"
                        >
                          <AlertCircle className="w-3 h-3" /> DESCONECTADO
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quando ativo, o robô responderá automaticamente no seu WhatsApp.
                  </p>
                </div>
                <Switch
                  checked={formData.whatsapp_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, whatsapp_enabled: checked })}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Connection Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCcw className="w-5 h-5 text-green-600" />
                Conexão com Aparelho
              </CardTitle>
              <CardDescription>
                Conecte seu celular para que o sistema possa enviar e receber mensagens.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10 space-y-6">
              {formData.whatsapp_status === 'disconnected' && (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <QrCode className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <Button onClick={handleGenerateQR} className="bg-green-600 hover:bg-green-700">
                    Gerar Novo QR Code
                  </Button>
                </div>
              )}

              {formData.whatsapp_status === 'pairing' && (
                <div className="text-center space-y-6">
                  <div className="p-4 bg-white border-2 border-dashed border-green-200 rounded-xl inline-block shadow-sm">
                    {qrCode ? (
                      <motion.img 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={qrCode} 
                        alt="QR Code WhatsApp" 
                        className="w-64 h-64 mx-auto"
                      />
                    ) : (
                      <div className="w-64 h-64 flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-green-500"></div>
                        <span className="text-sm text-muted-foreground">Gerando QR Code...</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Escaneie o código acima com seu WhatsApp</p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Vá em Configurações &gt; Aparelhos Conectados &gt; Conectar um Aparelho.
                    </p>
                    <Button variant="ghost" onClick={disconnectWhatsApp} className="text-destructive mt-4">
                      Cancelar Pareamento
                    </Button>
                  </div>
                </div>
              )}

              {formData.whatsapp_status === 'connected' && (
                <div className="text-center space-y-6">
                  <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-16 h-16 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Atendimento Online</h3>
                    <p className="text-muted-foreground">Seu WhatsApp está pronto para receber pedidos.</p>
                  </div>
                  <Button variant="outline" onClick={disconnectWhatsApp} className="text-destructive border-destructive hover:bg-destructive/5">
                    Desconectar Número
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bot Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Mensagens do Robô</CardTitle>
              <CardDescription>
                Personalize como o robô deve falar com seus clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="welcome">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="welcome"
                  placeholder="Olá! Digite seu pedido..."
                  rows={3}
                  value={formData.whatsapp_welcome_message}
                  onChange={(e) => setFormData({ ...formData, whatsapp_welcome_message: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">Dica: Use uma saudação amigável e convite para ver o cardápio.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="closing">Mensagem de Finalização</Label>
                <Textarea
                  id="closing"
                  placeholder="Pedido recebido! Obrigado."
                  rows={3}
                  value={formData.whatsapp_closing_message}
                  onChange={(e) => setFormData({ ...formData, whatsapp_closing_message: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">Dica: Informe ao cliente como ele pode acompanhar o pedido.</p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <div className="bg-muted/50 p-4 rounded-lg border border-dashed">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              Como funciona o Bot do WhatsApp?
            </h4>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>• O bot identifica o cliente pelo número do celular.</li>
              <li>• Ele envia o cardápio atualizado automaticamente.</li>
              <li>• Os pedidos caem direto na sua aba de "Pedidos" com um som de alerta.</li>
              <li>• Você pode assumir a conversa a qualquer momento no seu celular.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentWhatsApp;
