import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label: string;
  aspectRatio?: "square" | "banner";
  className?: string;
}

const ImageUpload = ({
  value,
  onChange,
  folder,
  label,
  aspectRatio = "square",
  className,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split(".").pop();
      const fileName = `${userData.user.id}/${folder}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("establishments")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("establishments")
        .getPublicUrl(fileName);

      onChange(urlData.publicUrl);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast.error(error.message || "Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">{label}</p>
      
      <div
        className={cn(
          "relative border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden transition-colors hover:border-primary/50",
          aspectRatio === "banner" ? "aspect-[3/1]" : "aspect-square w-32"
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <label
            className={cn(
              "flex flex-col items-center justify-center w-full h-full cursor-pointer",
              uploading && "pointer-events-none"
            )}
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground text-center px-2">
                  Clique para enviar
                </span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
