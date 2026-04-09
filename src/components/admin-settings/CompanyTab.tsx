import { useState, useEffect } from "react";
import { Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompanySettings, useUpdateCompanySettings } from "@/hooks/useAdminSettings";

export function CompanyTab() {
  const { data: settings, isLoading } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (settings) {
      setName(settings.name || "");
      setEmail(settings.email || "");
      setPhone(settings.phone || "");
      setAddress(settings.address || "");
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando configurações...</span>
      </div>
    );
  }

  const handleSave = () => {
    updateMutation.mutate({ name, email, phone, address });
  };

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-semibold text-lg">Dados da Empresa</h3>

      {/* Logo placeholder */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-heading font-bold">
            {initials || "GT"}
          </div>
          <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <Camera className="h-5 w-5 text-white/80" />
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Logo da empresa</p>
          <p className="text-xs text-muted-foreground/60">Upload de logo em breve</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome da empresa</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>E-mail institucional</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="contato@empresa.com" />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Endereço</Label>
        <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Endereço completo" rows={2} />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
