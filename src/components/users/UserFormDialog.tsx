import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";  
import { AppUser, UserStatus, Role, departments, userStatusConfig } from "./permissionsData";
import { Plus } from "lucide-react";
import { QuickAddDialog } from "@/components/shared/QuickAddDialog";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
  roles: Role[];
  onSave: (user: AppUser) => void;
}

const selectCls = "bg-white/[0.05] border-border rounded-lg h-9 text-xs focus:border-primary/50";
const selectContentCls = "bg-popover border-border text-foreground";
const selectItemCls = "text-xs focus:bg-white/[0.06] focus:text-foreground";
const inputCls = "bg-white/[0.05] border-border rounded-lg h-9 text-xs focus:border-primary/50";

export function UserFormDialog({ open, onOpenChange, user, roles, onSave }: UserFormDialogProps) {
  const [form, setForm] = useState<Partial<AppUser & { notes?: string }>>({});
  const [quickAddRoleOpen, setQuickAddRoleOpen] = useState(false);
  const [quickAddDeptOpen, setQuickAddDeptOpen] = useState(false);
  const [localRoles, setLocalRoles] = useState<Role[]>(roles);
  const [localDepts, setLocalDepts] = useState<string[]>(departments);

  useEffect(() => {
    if (user) setForm({ ...user });
    else setForm({ name: "", email: "", phone: "", roleId: "", department: "", status: "ativo" });
    setLocalRoles(roles);
    setLocalDepts(departments);
  }, [user, open, roles]);

  const handleSave = () => {
    if (!form.name?.trim() || !form.email?.trim() || !form.roleId) return;
    const saved: AppUser = {
      id: user?.id || crypto.randomUUID(),
      name: form.name!,
      email: form.email!,
      phone: form.phone || "",
      roleId: form.roleId!,
      department: form.department || "",
      status: (form.status as UserStatus) || "ativo",
      createdAt: user?.createdAt || new Date().toISOString().slice(0, 10),
      lastAccess: user?.lastAccess,
    };
    onSave(saved);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1 block">Nome completo *</label>
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Nome do usuário" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1 block">Email *</label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="email@empresa.com" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1 block">Telefone</label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1 flex items-center justify-between">
                Cargo / Perfil *
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 text-primary"
                  onClick={() => setQuickAddRoleOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </label>
              <Select value={form.roleId || ""} onValueChange={(v) => setForm({ ...form, roleId: v })}>
                <SelectTrigger className={selectCls}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent className={selectContentCls}>
                  {localRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id} className={selectItemCls}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1 flex items-center justify-between">
                Departamento
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 text-primary"
                  onClick={() => setQuickAddDeptOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </label>
              <Select value={form.department || ""} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className={selectCls}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent className={selectContentCls}>
                  {localDepts.map((d) => (
                    <SelectItem key={d} value={d} className={selectItemCls}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1 block">Status</label>
            <Select value={form.status || "ativo"} onValueChange={(v) => setForm({ ...form, status: v as UserStatus })}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {(Object.keys(userStatusConfig) as UserStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className={selectItemCls}>{userStatusConfig[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1 block">Observações (Opcional)</label>
            <Textarea value={(form as any).notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-white/[0.05] border-border rounded-lg text-xs focus:border-primary/50 resize-none" placeholder="Adicionar informações extras sobre o usuário..." rows={2} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground hover:bg-white/[0.06]">Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.name?.trim() || !form.email?.trim() || !form.roleId} className="gradient-primary border-0 text-white font-semibold rounded-full px-6">
            {user ? "Salvar" : "Criar Usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <QuickAddDialog
        open={quickAddRoleOpen}
        onOpenChange={setQuickAddRoleOpen}
        registryKey="usr_cargos"
        title="Novo Cargo/Perfil"
        onSuccess={(id, name) => {
          setLocalRoles([...localRoles, { id, name, permissions: {} as any, description: "", isSystem: false, usersCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
          setForm({ ...form, roleId: id });
        }}
      />
      <QuickAddDialog
        open={quickAddDeptOpen}
        onOpenChange={setQuickAddDeptOpen}
        registryKey="departamentos"
        title="Novo Departamento"
        onSuccess={(id, name) => {
          setLocalDepts([...localDepts, name].sort());
          setForm({ ...form, department: name });
        }}
      />
    </Dialog>
  );
}
