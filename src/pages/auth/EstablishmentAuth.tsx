import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Store, Mail, Lock, User, Phone, ArrowLeft, FileText } from "lucide-react";
import { ESTABLISHMENT_CATEGORIES } from "@/constants/categories";

type AuthMode = "login" | "register";

const EstablishmentAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    establishmentName: "",
    cpfCnpj: "",
    category: "restaurant",
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

      // Check if user has establishment role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (!roles?.some((r) => r.role === "establishment")) {
        await supabase.auth.signOut();
        toast.error("Esta conta não está vinculada a um estabelecimento.");
        setLoading(false);
        return;
      }

      toast.success("Login realizado com sucesso!");
      navigate("/estabelecimento");
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

      if (data.user) {
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
          cpf_cnpj: formData.cpfCnpj,
          category: formData.category,
        });

        toast.success("Cadastro realizado! Aguarde aprovação do seu estabelecimento.");
        navigate("/estabelecimento");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-orange-100/30 dark:from-orange-950/20 dark:via-background dark:to-orange-900/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
              <Store className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight mb-1">
            Portal do Estabelecimento
          </h1>
          <p className="text-muted-foreground">
            {mode === "login" ? "Acesse sua conta" : "Cadastre seu estabelecimento"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl p-6 border border-orange-200/50 dark:border-orange-800/30">
          <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
            <div className="space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-orange-500" />
                      Nome do Responsável
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Seu nome"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="h-12 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="establishmentName" className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-orange-500" />
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
                      className="h-12 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-orange-500" />
                      Categoria
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger className="h-12 focus:ring-orange-500">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTABLISHMENT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-orange-500" />
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
                      className="h-12 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpfCnpj" className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-orange-500" />
                      CPF ou CNPJ
                    </Label>
                    <Input
                      id="cpfCnpj"
                      name="cpfCnpj"
                      type="text"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={formData.cpfCnpj}
                      onChange={handleChange}
                      required
                      className="h-12 focus-visible:ring-orange-500"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-orange-500" />
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
                  className="h-12 focus-visible:ring-orange-500"
                />
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-orange-500" />
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
                  className="h-12 focus-visible:ring-orange-500"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
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
                  className="text-orange-600 hover:underline text-sm"
                >
                  Não tem conta? Cadastre seu estabelecimento
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-orange-600 hover:underline text-sm inline-flex items-center gap-1"
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

export default EstablishmentAuth;
