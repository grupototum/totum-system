import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Role, PermissionsMap, buildEmptyAccess } from "./permissionsData";
import { PermissionMatrix } from "./PermissionMatrix";

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onSave: (role: Role) => void;
}

export function RoleFormDialog({ open, onOpenChange, role, onSave }: RoleFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<PermissionsMap>(buildEmptyAccess());

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
      setPermissions({ ...role.permissions });
    } else {
      setName("");
      setDescription("");
      setPermissions(buildEmptyAccess());
    }
  }, [role, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    const saved: Role = {
      id: role?.id || "",
      name,
      description,
      permissions,
      isSystem: role?.isSystem || false,
      usersCount: role?.usersCount || 0,
    };
    onSave(saved);
    onOpenChange(false);
  };

  const inputCls = "bg-white/[0.05] border-border rounded-lg h-9 text-xs focus:border-primary/50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{role ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1 block">Nome do Cargo *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ex: Gestor de Projetos" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1 block">Descrição</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Breve descrição do cargo" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-2 block">Permissões</label>
            <PermissionMatrix permissions={permissions} onChange={setPermissions} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground hover:bg-white/[0.06]">Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="gradient-primary border-0 text-white font-semibold rounded-full px-6">
            {role ? "Salvar" : "Criar Cargo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
