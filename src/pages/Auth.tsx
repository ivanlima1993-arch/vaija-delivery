import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, User, Phone, Store, ArrowLeft, Clock } from "lucide-react";
import logo from "@/assets/logo.png";

type AuthMode = "login" | "register" | "register-establishment";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") as AuthMode || "login";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    establishmentName: "",
  });

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

      // Check user roles to redirect properly
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      toast.success("Login realizado com sucesso!");

      // Redirect based on role
      if (roles?.some((r) => r.role === "establishment")) {
        const { data: est, error: estError } = await supabase
          .from("establishments")
          .select("is_approved, created_at")
          .eq("owner_id", data.user.id)
          .maybeSingle();

        if (est && !est.is_approved) {
          await supabase.auth.signOut();
          setCreatedAt(est.created_at);
          setPendingApproval(true);
          return;
        }
        navigate("/estabelecimento");
      } else if (roles?.some((r) => r.role === "admin")) {
        navigate("/admin");
      } else if (roles?.some((r) => r.role === "driver")) {
        navigate("/entregador");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (error) throw error;

      // If registering as establishment, create the establishment
      if (mode === "register-establishment" && data.user) {
        // Add establishment role
        await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: "establishment",
        });

        // Create establishment
        const { data: est, error: estError } = await supabase.from("establishments").insert({
          owner_id: data.user.id,
          name: formData.establishmentName,
          phone: formData.phone,
          is_approved: false, // Explicitly set to false
        }).select("created_at").single();

        if (estError) throw estError;

        await supabase.auth.signOut();
        setCreatedAt(est.created_at);
        setPendingApproval(true);
        toast.success("Cadastro realizado! Aguarde a aprovação administrativa.");
      } else {
        toast.success("Cadastro realizado com sucesso!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer cadastro");
    } finally {
      setLoading(false);
    }
  };

  const ApprovalTimer = ({ createdAt }: { createdAt: string }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
      const target = new Date(createdAt);
      target.setHours(target.getHours() + 24);

      const updateTimer = () => {
        const now = new Date();
        const diff = target.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft("00:00:00");
          return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      };

      const timer = setInterval(updateTimer, 1000);
      updateTimer();
      return () => clearInterval(timer);
    }, [createdAt]);

    return (
      <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-2xl shadow-xl border border-border text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <Clock className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-display">Aprovação em Andamento</h2>
          <p className="text-sm text-muted-foreground px-4">
            Seu cadastro como estabelecimento está sendo revisado por nossa equipe. O prazo médio de aprovação é de 24 horas.
          </p>
        </div>
        <div className="bg-muted px-6 py-4 rounded-2xl w-full">
          <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Tempo Estimado Restante</p>
          <p className="text-3xl font-black font-mono text-primary">{timeLeft}</p>
        </div>
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl"
          onClick={() => setPendingApproval(false)}
        >
          Voltar para Login
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Vai Já Delivery"
            className="h-24 w-auto object-contain mx-auto mb-4 animate-logo-pulse"
          />
          <p className="text-muted-foreground">
            {mode === "login" && "Entre na sua conta"}
            {mode === "register" && "Crie sua conta"}
            {mode === "register-establishment" && "Cadastre seu estabelecimento"}
          </p>
        </div>

        {/* Card */}
        {pendingApproval && createdAt ? (
          <ApprovalTimer createdAt={createdAt} />
        ) : (
          <div className="bg-card rounded-2xl shadow-xl p-6 border border-border">
            <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
              <div className="space-y-4">
                {mode !== "login" && (
                  <div>
                    <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-primary" />
                      Nome Completo
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Seu nome"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="h-12"
                    />
                  </div>
                )}

                {mode === "register-establishment" && (
                  <>
                    <div>
                      <Label htmlFor="establishmentName" className="flex items-center gap-2 mb-2">
                        <Store className="w-4 h-4 text-primary" />
                        Nome do Estabelecimento
                      </Label>
                      <Input
                        id="establishmentName"
                        name="establishmentName"
                        type="text"
                        placeholder="Nome do seu negócio"
                        value={formData.establishmentName}
                        onChange={handleChange}
                        required
                        className="h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-primary" />
                        Telefone/WhatsApp
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="h-12"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-primary" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="h-12"
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full h-12"
                  disabled={loading}
                >
                  {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Cadastrar"}
                </Button>
              </div>
            </form>

            {/* Mode Switchers */}
            <div className="mt-6 space-y-3">
              {mode === "login" ? (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-primary hover:underline text-sm"
                  >
                    Não tem conta? Cadastre-se
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para login
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Voltar para o início
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
