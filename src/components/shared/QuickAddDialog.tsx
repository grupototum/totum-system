import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { attachOrganizationId } from "@/lib/tenant";
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
  const { tenant } = useTenant();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Extended fields for project_types
  const [serviceTypes, setServiceTypes] = useState<{ id: string; name: string }[]>([]);
  const [revenueTypes, setRevenueTypes] = useState<{ id: string; name: string }[]>([]);
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [revenueTypeId, setRevenueTypeId] = useState("");

  const isProjectType = registryKey === "tipos_projeto";

  useEffect(() => {
    if (open && isProjectType) {
      Promise.all([
        supabase.from("service_types").select("id, name").eq("is_active", true).order("name"),
        supabase.from("revenue_types").select("id, name").eq("is_active", true).order("name"),
      ]).then(([st, rt]) => {
        setServiceTypes((st.data as any[]) || []);
        setRevenueTypes((rt.data as any[]) || []);
      });
    }
    if (!open) {
      setName("");
      setServiceTypeId("");
      setRevenueTypeId("");
    }
  }, [open, isProjectType]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const tableName = tableMap[registryKey] || registryKey;
    
    const payload: any = { name: name.trim() };
    if (tableName === "plans") {
      payload.is_active = true;
    } else if (tableName === "roles") {
      // Roles might need more fields, but name is usually enough for simple add
    } else if (tableName !== "clients") {
      payload.is_active = true;
    }

    // Include extended fields for project_types
    if (isProjectType && tableName === "project_types") {
      if (serviceTypeId) payload.service_type_id = serviceTypeId;
      if (revenueTypeId) payload.revenue_type_id = revenueTypeId;
    }

    const scopedPayload = tableName === "clients"
      ? attachOrganizationId(payload, tenant?.organization_id)
      : payload;

    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .insert(scopedPayload)
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
      setServiceTypeId("");
      setRevenueTypeId("");
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
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
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
              className="bg-white/[0.03] border-border"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isProjectType) handleSave();
              }}
            />
          </div>

          {isProjectType && (
            <>
              <div className="space-y-2">
                <Label htmlFor="service_type">Tipo de Serviço</Label>
                <Select value={serviceTypeId} onValueChange={setServiceTypeId}>
                  <SelectTrigger id="service_type" className="bg-white/[0.03] border-border">
                    <SelectValue placeholder="Selecione o tipo de serviço (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((st) => (
                      <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue_type">Tipo de Receita</Label>
                <Select value={revenueTypeId} onValueChange={setRevenueTypeId}>
                  <SelectTrigger id="revenue_type" className="bg-white/[0.03] border-border">
                    <SelectValue placeholder="Selecione o tipo de receita (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueTypes.map((rt) => (
                      <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
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
