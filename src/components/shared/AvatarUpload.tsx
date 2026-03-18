import { useState, useRef } from "react";
import { Camera, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface AvatarUploadProps {
  avatarUrl?: string | null;
  fullName?: string;
  size?: "sm" | "md" | "lg";
  onUploaded?: (url: string | null) => void;
  editable?: boolean;
}

export function UserAvatar({ avatarUrl, fullName, size = "md" }: { avatarUrl?: string | null; fullName?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-20 w-20 text-2xl",
  };

  const initials = (fullName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roundedClass = size === "lg" ? "rounded-2xl" : "rounded-full";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName || "Avatar"}
        className={`${sizeClasses[size]} ${roundedClass} object-cover shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${roundedClass} gradient-primary flex items-center justify-center font-heading font-bold shrink-0`}>
      {initials}
    </div>
  );
}

export function AvatarUpload({ avatarUrl, fullName, size = "lg", onUploaded, editable = true }: AvatarUploadProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Aceitos: JPG, PNG ou WebP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast({ title: "Arquivo muito grande", description: `Máximo de ${MAX_SIZE_MB}MB.`, variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);

    const ext = selectedFile.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/avatar.${ext}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, selectedFile, { upsert: true, contentType: selectedFile.type });

    if (uploadError) {
      toast({ title: "Erro no upload", description: "Não foi possível enviar a imagem. Tente novamente.", variant: "destructive" });
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    if (updateError) {
      toast({ title: "Erro ao salvar", description: "Imagem enviada mas não foi possível vincular ao perfil.", variant: "destructive" });
    } else {
      toast({ title: "Foto atualizada", description: "Sua foto de perfil foi salva com sucesso." });
      onUploaded?.(publicUrl);
    }

    setPreview(null);
    setSelectedFile(null);
    setUploading(false);
  };

  const handleRemove = async () => {
    if (!user) return;
    setUploading(true);

    // Try to remove from storage (may not exist)
    await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível remover a foto.", variant: "destructive" });
    } else {
      toast({ title: "Foto removida" });
      onUploaded?.(null);
    }

    setPreview(null);
    setSelectedFile(null);
    setUploading(false);
  };

  const cancelPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const displayUrl = preview || avatarUrl;

  return (
    <div className="flex items-center gap-5">
      <div className="relative group">
        <UserAvatar avatarUrl={displayUrl} fullName={fullName} size={size} />
        {editable && !preview && (
          <div
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            <Camera className="h-5 w-5 text-white/80" />
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="flex flex-col gap-2">
        {preview ? (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Salvar foto
            </Button>
            <Button size="sm" variant="outline" onClick={cancelPreview} disabled={uploading}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancelar
            </Button>
          </div>
        ) : editable ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              {avatarUrl ? "Trocar foto" : "Enviar foto"}
            </Button>
            {avatarUrl && (
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleRemove} disabled={uploading}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remover
              </Button>
            )}
          </div>
        ) : null}
        {editable && <p className="text-[11px] text-muted-foreground">JPG, PNG ou WebP • máx. {MAX_SIZE_MB}MB</p>}
      </div>
    </div>
  );
}
