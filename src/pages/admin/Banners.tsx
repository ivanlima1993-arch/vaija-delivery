import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Menu,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Image,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  link_url: string | null;
  position: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const AdminBanners = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    image_url: "",
    title: "",
    subtitle: "",
    button_text: "Ver Mais",
    link_url: "",
    expires_at: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!authLoading && user && !isAdmin) {
      toast.error("Acesso negado. Área restrita para administradores.");
      navigate("/");
      return;
    }
    if (user && isAdmin) {
      fetchBanners();
    }
  }, [user, authLoading, isAdmin, navigate]);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("home_banners")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      toast.error("Erro ao carregar banners");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.image_url) {
      toast.error("A URL da imagem é obrigatória.");
      return;
    }
    setSaving(true);
    try {
      const maxPosition = banners.length > 0 ? Math.max(...banners.map(b => b.position)) : 0;
      const { error } = await supabase.from("home_banners").insert({
        image_url: form.image_url,
        title: form.title || null,
        subtitle: form.subtitle || null,
        button_text: form.button_text || "Ver Mais",
        link_url: form.link_url || null,
        expires_at: form.expires_at || null,
        position: maxPosition + 1,
        is_active: true,
      });
      if (error) throw error;

      toast.success("Banner criado com sucesso!");
      setShowForm(false);
      setForm({ image_url: "", title: "", subtitle: "", button_text: "Ver Mais", link_url: "", expires_at: "" });
      fetchBanners();
    } catch (err) {
      toast.error("Erro ao criar banner");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from("home_banners")
        .update({ is_active: !banner.is_active })
        .eq("id", banner.id);
      if (error) throw error;
      toast.success(banner.is_active ? "Banner desativado" : "Banner ativado");
      fetchBanners();
    } catch {
      toast.error("Erro ao atualizar banner");
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este banner?")) return;
    try {
      const { error } = await supabase.from("home_banners").delete().eq("id", id);
      if (error) throw error;
      toast.success("Banner excluído");
      fetchBanners();
    } catch {
      toast.error("Erro ao excluir banner");
    }
  };

  const movePosition = async (banner: Banner, direction: "up" | "down") => {
    const sorted = [...banners].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex(b => b.id === banner.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    try {
      await supabase.from("home_banners").update({ position: other.position }).eq("id", banner.id);
      await supabase.from("home_banners").update({ position: banner.position }).eq("id", other.id);
      fetchBanners();
    } catch {
      toast.error("Erro ao reordenar banners");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg">Banners da Home</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie os banners exibidos na página inicial
                </p>
              </div>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Banner
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Create Form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-primary" />
                    Novo Banner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label>URL da Imagem *</Label>
                      <Input
                        placeholder="https://... (cole o link da imagem)"
                        value={form.image_url}
                        onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                      />
                      {form.image_url && (
                        <div className="mt-2 rounded-xl overflow-hidden aspect-[16/5] bg-muted">
                          <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        placeholder="Título do banner"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtítulo</Label>
                      <Input
                        placeholder="Subtítulo ou descrição"
                        value={form.subtitle}
                        onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL do Link (destino ao clicar)</Label>
                      <Input
                        placeholder="/restaurantes, /servicos, https://..."
                        value={form.link_url}
                        onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto do Botão</Label>
                      <Input
                        placeholder="Ver Mais"
                        value={form.button_text}
                        onChange={e => setForm(f => ({ ...f, button_text: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiração (opcional)</Label>
                      <Input
                        type="datetime-local"
                        value={form.expires_at}
                        onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleCreate} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Criar Banner
                    </Button>
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Banners List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Banners Cadastrados
                <Badge variant="secondary" className="ml-2">{banners.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {banners.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Nenhum banner cadastrado</p>
                  <p className="text-sm mt-1">Clique em "Novo Banner" para começar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...banners].sort((a, b) => a.position - b.position).map((banner, idx) => (
                    <motion.div
                      key={banner.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-4 p-4 border rounded-xl bg-muted/30"
                    >
                      {/* Preview */}
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img src={banner.image_url} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{banner.title || <span className="text-muted-foreground italic">Sem título</span>}</p>
                        <p className="text-sm text-muted-foreground truncate">{banner.subtitle || "—"}</p>
                        {banner.link_url && (
                          <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" />
                            {banner.link_url}
                          </a>
                        )}
                      </div>

                      {/* Status */}
                      <Badge variant={banner.is_active ? "default" : "secondary"}>
                        {banner.is_active ? "Ativo" : "Inativo"}
                      </Badge>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => movePosition(banner, "up")} disabled={idx === 0} title="Mover para cima">
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => movePosition(banner, "down")} disabled={idx === banners.length - 1} title="Mover para baixo">
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(banner)} title={banner.is_active ? "Desativar" : "Ativar"}>
                          {banner.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteBanner(banner.id)} title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminBanners;
