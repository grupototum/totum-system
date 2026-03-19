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
import { AppUser, UserStatus, Role, userStatusConfig } from "./permissionsData";
import { QuickAddDialog } from "@/components/shared/QuickAddDialog";
import { useRegistryData } from "@/hooks/useRegistryData";
import { Plus } from "lucide-react";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
  roles: Role[];
  onSave: (user: AppUser) => void;
}

const selectCls = "bg-white/[0.05] border-white/[0.1] rounded-lg h-9 text-xs focus:border-primary/50";
const selectContentCls = "bg-[#271c1d] border-white/[0.1] text-white";
const selectItemCls = "text-xs focus:bg-white/[0.06] focus:text-white";
const inputCls = "bg-white/[0.05] border-white/[0.1] rounded-lg h-9 text-xs focus:border-primary/50";

export function UserFormDialog({ open, onOpenChange, user, roles, onSave }: UserFormDialogProps) {
  const [form, setForm] = useState<Partial<AppUser & { notes?: string }>>({});
  const { data: dbDepartments, refetch: refetchDepts } = useRegistryData("departamentos");
  const [showQuickAddDept, setShowQuickAddDept] = useState(false);

  useEffect(() => {
    if (user) setForm({ ...user });
    else setForm({ name: "", email: "", phone: "", roleId: "", department: "", status: "ativo" });
  }, [user, open]);

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
      <DialogContent className="bg-bg-primary/95 backdrop-blur-2xl border-white/10 text-white max-w-md rounded-[var(--radius-lg)] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-xl tracking-tight">{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-[10px] font-heading font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 block">Nome completo *</label>
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Nome do usuário" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-heading font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 block">Email *</label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="email@empresa.com" />
            </div>
            <div>
              <label className="text-[10px] font-heading font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 block">Telefone</label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-heading font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 block">Cargo / Perfil *</label>
              <Select value={form.roleId || ""} onValueChange={(v) => setForm({ ...form, roleId: v })}>
                <SelectTrigger className={selectCls}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent className="bg-bg-secondary border-white/10 text-white backdrop-blur-xl">
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="focus:bg-white/[0.08] cursor-pointer">{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-heading font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 block">Departamento</label>
              <div className="flex gap-2">
                <Select value={form.department || ""} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger className={selectCls}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent className="bg-bg-secondary border-white/10 text-white backdrop-blur-xl">
                    {dbDepartments.map((d) => (
                      <SelectItem key={d.id} value={d.name} className="focus:bg-white/[0.08] cursor-pointer">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9 shrink-0 bg-white/[0.03] border-white/10 hover:bg-white/[0.08] rounded-lg"
                  onClick={() => setShowQuickAddDept(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-heading font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 block">Status</label>
            <Select value={form.status || "ativo"} onValueChange={(v) => setForm({ ...form, status: v as UserStatus })}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-bg-secondary border-white/10 text-white backdrop-blur-xl">
                {(Object.keys(userStatusConfig) as UserStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="focus:bg-white/[0.08] cursor-pointer">{userStatusConfig[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-heading font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 block">Observações (Opcional)</label>
            <Textarea value={(form as any).notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-white/[0.04] border-white/10 rounded-xl text-xs focus:border-primary/50 resize-none" placeholder="Adicionar informações extras sobre o usuário..." rows={2} />
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl h-11">Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.name?.trim() || !form.email?.trim() || !form.roleId} className="gradient-primary border-0 text-white font-bold rounded-xl h-11 px-8">
            {user ? "Salvar" : "Criar Usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <QuickAddDialog 
        open={showQuickAddDept} 
        onOpenChange={setShowQuickAddDept} 
        registryKey="departamentos" 
        title="Novo Departamento" 
        onSuccess={() => refetchDepts()}
      />
    </Dialog>
  );
}
