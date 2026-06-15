import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Mail, Lock, ArrowLeft, ArrowRight, TrendingUp,
  MapPin, Zap, HeartHandshake, ShieldCheck, Eye, EyeOff, Loader2
} from "lucide-react";
import logo from "@/assets/logo.png";

type AuthMode = "login" | "forgot-password";

const BENEFITS = [
  {
    icon: MapPin,
    color: "from-orange-400 to-red-500",
    title: "Exclusividade Territorial",
    description: "Você é o único franqueado autorizado na sua cidade. Zero competição interna.",
  },
  {
    icon: TrendingUp,
    color: "from-green-400 to-emerald-600",
    title: "Comissões Recorrentes",
    description: "Ganhe uma porcentagem de cada pedido feito no app. A cidade trabalha para você.",
  },
  {
    icon: Zap,
    color: "from-blue-400 to-indigo-600",
    title: "Tecnologia de Ponta",
    description: "App completo, painel de controle avançado e atualizações automáticas incluídas.",
  },
  {
    icon: HeartHandshake,
    color: "from-purple-400 to-pink-500",
    title: "Suporte Dedicado",
    description: "Time especializado para te ajudar a crescer e cadastrar novos parceiros.",
  },
];

const STATS = [
  { value: "R$ 15k+", label: "Faturamento médio/mês" },
  { value: "1 por cidade", label: "Exclusividade garantida" },
  { value: "24h", label: "Suporte disponível" },
];

const FranchiseeAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const isFranchisee = roles?.some((r) => r.role === "franchisee");
      const isAdmin = roles?.some((r) => r.role === "admin");

      if (!isFranchisee && !isAdmin) {
        await supabase.auth.signOut();
        toast.error("Acesso restrito. Esta área é exclusiva para franqueados Vai Já.");
        return;
      }

      toast.success("Bem-vindo ao Painel do Franqueado! 🚀");
      navigate(isAdmin ? "/admin" : "/franqueado");
    } catch (error: any) {
      toast.error(error.message || "E-mail ou senha incorretos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/#/auth?mode=update-password`,
      });
      if (error) throw error;
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setMode("login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background overflow-hidden">

      {/* ─── LEFT PANEL – Benefits ─── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden"
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#2d0a5e] to-[#0f172a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(234,88,12,0.2),transparent_60%)]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-20 right-16 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-32 left-10 w-48 h-48 bg-orange-500/15 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: "1.5s" }} />

        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14 text-white">
          {/* Logo */}
          <div>
            <img src={logo} alt="Vai Já Delivery" className="h-14 w-auto object-contain mb-2" />
            <p className="text-violet-300 text-sm font-semibold tracking-widest uppercase">
              Portal do Franqueado
            </p>
          </div>

          {/* Headline */}
          <div className="my-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tighter mb-4">
                Seja{" "}
                <span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">
                  dono do app
                </span>{" "}
                na sua cidade.
              </h1>
              <p className="text-white/60 text-lg font-medium max-w-md">
                Gerencie estabelecimentos, pedidos e entregadores da sua região em um único painel poderoso.
              </p>
            </motion.div>

            {/* Stats */}
            <div className="flex gap-6 mt-8">
              {STATS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 + i * 0.1 }}
                  className="flex flex-col"
                >
                  <span className="text-2xl font-black text-white">{s.value}</span>
                  <span className="text-xs text-white/50 font-medium">{s.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Benefits list */}
          <div className="space-y-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/8 transition-colors"
              >
                <div className={`shrink-0 p-2.5 rounded-xl bg-gradient-to-br ${b.color} shadow-lg`}>
                  <b.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{b.title}</p>
                  <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{b.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer note */}
          <p className="mt-8 text-xs text-white/30 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
            Acesso restrito a franqueados credenciados Vai Já Delivery.
          </p>
        </div>
      </motion.div>

      {/* ─── RIGHT PANEL – Login Form ─── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 bg-background"
      >
        {/* Mobile logo */}
        <div className="md:hidden mb-8 text-center">
          <img src={logo} alt="Vai Já Delivery" className="h-14 w-auto object-contain mx-auto mb-2" />
          <p className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
            Portal do Franqueado
          </p>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            {mode === "forgot-password" ? (
              <button
                onClick={() => setMode("login")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar para o login
              </button>
            ) : null}
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              {mode === "login" ? "Acessar Painel" : "Recuperar Acesso"}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {mode === "login"
                ? "Entre com suas credenciais de franqueado para continuar."
                : "Informe seu e-mail cadastrado para redefinir sua senha."}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={mode === "login" ? handleLogin : handleForgotPassword}
            className="space-y-5"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-11 h-13 rounded-2xl border-border/60 bg-muted/40 focus-visible:ring-violet-500 focus-visible:border-violet-500 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Password (login only) */}
            {mode === "login" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="text-xs text-violet-600 hover:text-violet-700 font-semibold transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="pl-11 pr-12 h-13 rounded-2xl border-border/60 bg-muted/40 focus-visible:ring-violet-500 focus-visible:border-violet-500 text-sm font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-13 rounded-2xl text-base font-black bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-lg shadow-violet-500/30 transition-all mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === "login" ? (
                <>
                  Entrar no Painel
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                "Enviar Link de Recuperação"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs text-muted-foreground font-medium">
                Ainda não é franqueado?
              </span>
            </div>
          </div>

          {/* CTA to Landing */}
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl border-border/60 font-bold text-sm hover:border-violet-500 hover:text-violet-600 transition-all"
            onClick={() => navigate("/seja-franqueado")}
          >
            Quero me tornar Franqueado
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Back to home */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar para o início
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FranchiseeAuth;
