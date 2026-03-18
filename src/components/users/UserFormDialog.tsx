import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AppUser, UserStatus, Role, departments, userStatusConfig } from "./permissionsData";

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
  const [form, setForm] = useState<Partial<AppUser>>({});

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
      <DialogContent className="bg-[#1e1516] border-white/[0.1] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Nome completo *</label>
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Nome do usuário" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Email *</label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="email@empresa.com" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Telefone</label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Cargo / Perfil *</label>
              <Select value={form.roleId || ""} onValueChange={(v) => setForm({ ...form, roleId: v })}>
                <SelectTrigger className={selectCls}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent className={selectContentCls}>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id} className={selectItemCls}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Departamento</label>
              <Select value={form.department || ""} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className={selectCls}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent className={selectContentCls}>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d} className={selectItemCls}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Status</label>
            <Select value={form.status || "ativo"} onValueChange={(v) => setForm({ ...form, status: v as UserStatus })}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {(Object.keys(userStatusConfig) as UserStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className={selectItemCls}>{userStatusConfig[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/50 hover:text-white hover:bg-white/[0.06]">Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.name?.trim() || !form.email?.trim() || !form.roleId} className="gradient-primary border-0 text-white font-semibold rounded-full px-6">
            {user ? "Salvar" : "Criar Usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
