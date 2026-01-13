import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Mail, Lock, User, Phone, Store, ArrowLeft } from "lucide-react";

type AuthMode = "login" | "register" | "register-establishment";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") as AuthMode || "login";
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
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
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      navigate("/");
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
        await supabase.from("establishments").insert({
          owner_id: data.user.id,
          name: formData.establishmentName,
          phone: formData.phone,
        });

        toast.success("Cadastro realizado! Aguarde aprovação do seu estabelecimento.");
        navigate("/estabelecimento");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-gradient-primary p-2 rounded-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tight">
              VAIJÁ
            </span>
          </div>
          <p className="text-muted-foreground">
            {mode === "login" && "Entre na sua conta"}
            {mode === "register" && "Crie sua conta"}
            {mode === "register-establishment" && "Cadastre seu estabelecimento"}
          </p>
        </div>

        {/* Card */}
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
              <>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-primary hover:underline text-sm"
                  >
                    Não tem conta? Cadastre-se
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setMode("register-establishment")}
                >
                  <Store className="w-4 h-4 mr-2" />
                  Quero cadastrar meu estabelecimento
                </Button>
              </>
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
