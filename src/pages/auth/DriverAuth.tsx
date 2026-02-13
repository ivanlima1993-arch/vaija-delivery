import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bike, Mail, Lock, User, Phone, ArrowLeft, FileText, MapPin, Calendar, Camera } from "lucide-react";

type AuthMode = "login" | "register";

const DriverAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    cpf: "",
    vehicleType: "moto",
    vehiclePlate: "",
    birthDate: "",
    address: "",
  });
  const [facePhoto, setFacePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, type: "face" | "id") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === "face") {
        setFacePhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        setIdPhoto(file);
        setIdPhotoPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

      // Check if user has driver role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (!roles?.some((r) => r.role === "driver")) {
        await supabase.auth.signOut();
        toast.error("Esta conta não está cadastrada como entregador.");
        setLoading(false);
        return;
      }

      toast.success("Login realizado com sucesso!");
      navigate("/entregador");
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
        // Add driver role
        await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: "driver",
        });

        let facePhotoUrl = "";
        if (facePhoto) {
          const fileExt = facePhoto.name.split(".").pop();
          const fileName = `${data.user.id}/face_${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("driver-documents")
            .upload(fileName, facePhoto);

          if (uploadError) {
            console.error("Face photo upload error:", uploadError);
            toast.error("Erro ao enviar foto do rosto: " + uploadError.message);
          } else {
            const { data: publicUrl } = supabase.storage
              .from("driver-documents")
              .getPublicUrl(fileName);
            facePhotoUrl = publicUrl.publicUrl;
          }
        }

        let idPhotoUrl = "";
        if (idPhoto) {
          const fileExt = idPhoto.name.split(".").pop();
          const fileName = `${data.user.id}/id_${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("driver-documents")
            .upload(fileName, idPhoto);

          if (uploadError) {
            console.error("ID photo upload error:", uploadError);
            toast.error("Erro ao enviar foto do RG: " + uploadError.message);
          } else {
            const { data: publicUrl } = supabase.storage
              .from("driver-documents")
              .getPublicUrl(fileName);
            idPhotoUrl = publicUrl.publicUrl;
          }
        }

        // Update profile with all info
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            phone: formData.phone,
            cpf_cnpj: formData.cpf,
            driver_vehicle_plate: formData.vehiclePlate,
            driver_birth_date: formData.birthDate,
            driver_address: formData.address,
            face_photo_url: facePhotoUrl,
            driver_id_photo_url: idPhotoUrl,
            is_driver_approved: false,
            driver_registration_submitted_at: new Date().toISOString()
          })
          .eq("user_id", data.user.id);

        if (updateError) {
          console.error("Profile update error:", updateError);
          throw new Error("Erro ao salvar dados do perfil: " + updateError.message);
        }

        toast.success("Cadastro realizado! Sua conta está em análise para aprovação.");
        navigate("/entregador");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Erro ao fazer cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-emerald-100/30 dark:from-emerald-950/20 dark:via-background dark:to-emerald-900/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg">
              <Bike className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight mb-1">
            Portal do Entregador
          </h1>
          <p className="text-muted-foreground">
            {mode === "login" ? "Acesse sua conta" : "Cadastre-se como entregador"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl p-6 border border-emerald-200/50 dark:border-emerald-800/30">
          <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
            <div className="space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-emerald-500" />
                      Nome Completo
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="h-12 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-emerald-500" />
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
                      className="h-12 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf" className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={handleChange}
                      required
                      className="h-12 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehiclePlate" className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      Placa do Veículo
                    </Label>
                    <Input
                      id="vehiclePlate"
                      name="vehiclePlate"
                      type="text"
                      placeholder="ABC-1234"
                      value={formData.vehiclePlate}
                      onChange={handleChange}
                      required={formData.vehicleType !== "bicicleta" && formData.vehicleType !== "a_pe"}
                      className="h-12 focus-visible:ring-emerald-500 uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthDate" className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleChange}
                      required
                      className="h-12 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      Endereço Completo
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Rua, número, bairro, cidade"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="h-12 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-emerald-500" />
                      Foto do Rosto (Selfie)
                    </Label>
                    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50/30">
                      {photoPreview ? (
                        <div className="relative w-32 h-32">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-full border-2 border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFacePhoto(null);
                              setPhotoPreview(null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                          >
                            <ArrowLeft className="w-4 h-4 rotate-45" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            Tire uma foto nítida do seu rosto
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("photo-upload")?.click()}
                            className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                          >
                            Selecionar Foto
                          </Button>
                        </div>
                      )}
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => handlePhotoChange(e, "face")}
                        className="hidden"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-emerald-500" />
                      Foto do RG (Frente)
                    </Label>
                    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50/30">
                      {idPhotoPreview ? (
                        <div className="relative w-full aspect-video">
                          <img
                            src={idPhotoPreview}
                            alt="RG Preview"
                            className="w-full h-full object-cover rounded-lg border-2 border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIdPhoto(null);
                              setIdPhotoPreview(null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                          >
                            <ArrowLeft className="w-4 h-4 rotate-45" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            Tire uma foto nítida da frente do seu RG
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("id-photo-upload")?.click()}
                            className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                          >
                            Selecionar RG
                          </Button>
                        </div>
                      )}
                      <input
                        id="id-photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, "id")}
                        className="hidden"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="vehicleType" className="flex items-center gap-2 mb-2">
                      <Bike className="w-4 h-4 text-emerald-500" />
                      Veículo
                    </Label>
                    <select
                      id="vehicleType"
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      required
                      className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="moto">Moto</option>
                      <option value="bicicleta">Bicicleta</option>
                      <option value="carro">Carro</option>
                      <option value="a_pe">A pé</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-emerald-500" />
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
                  className="h-12 focus-visible:ring-emerald-500"
                />
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
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
                  className="h-12 focus-visible:ring-emerald-500"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
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
                  className="text-emerald-600 hover:underline text-sm"
                >
                  Não tem conta? Cadastre-se como entregador
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-emerald-600 hover:underline text-sm inline-flex items-center gap-1"
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

export default DriverAuth;
