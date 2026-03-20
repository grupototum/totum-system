import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registryKey: string;
  title: string;
  onSuccess?: (id: string, name: string) => void;
}

const tableMap: Record<string, string> = {
  tipos_cliente: "client_types",
  tipos_projeto: "project_types",
  tipos_contrato: "contract_types",
  planos: "plans",
  setores: "departments",
  usr_cargos: "roles",
  fornecedores: "clients",
  categorias_produto: "product_types",
  departamentos: "departments"
};

export function QuickAddDialog({ open, onOpenChange, registryKey, title, onSuccess }: QuickAddDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const tableName = tableMap[registryKey] || registryKey;
    
    // Most registry tables have same basic structure
    const payload: any = { name: name.trim() };
    if (tableName === "plans") {
      payload.is_active = true;
    } else if (tableName === "roles") {
      // Roles might need more fields, but name is usually enough for simple add
    } else if (tableName !== "clients") {
      payload.is_active = true;
    }

    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${title} criado com sucesso.`,
      });

      if (onSuccess) {
        onSuccess((data as any).id, (data as any).name || name);
      }
      
      setName("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1e1516] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome / Título</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome..."
              className="bg-white/[0.03] border-white/10"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !name.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
