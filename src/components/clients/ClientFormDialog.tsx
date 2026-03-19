import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { QuickAddDialog } from "@/components/shared/QuickAddDialog";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<boolean>;
  editData?: any | null;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
}

function validateEmail(email: string) {
  if (!email) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : "E-mail inválido";
}

function validatePhone(phone: string) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? undefined : "Telefone deve ter pelo menos 10 dígitos";
}

function formatDocument(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
      d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a
    );
  }
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, d, e) =>
    e ? `${a}.${b}.${c}/${d}-${e}` : d ? `${a}.${b}.${c}/${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) =>
      c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : ""
    );
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) =>
    c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : ""
  );
}

export function ClientFormDialog({ open, onOpenChange, onSubmit, editData }: Props) {
  const [clientTypes, setClientTypes] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [showQuickAddType, setShowQuickAddType] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    name: "", email: "", phone: "", document: "", address: "",
    client_type_id: "", notes: "",
  });

  useEffect(() => {
    if (open) {
      const fetchTypes = () => {
        supabase.from("client_types").select("id, name").eq("is_active", true).order("name")
          .then(({ data }) => setClientTypes(data || []));
      };
      fetchTypes();
      (window as any)._refreshClientTypes = fetchTypes;

      if (editData) {
        setForm({
          name: editData.name || "",
          email: editData.email || "",
          phone: editData.phone || "",
          document: editData.document || "",
          address: editData.address || "",
          client_type_id: editData.client_type_id || "",
          notes: editData.notes || "",
        });
      } else {
        setForm({ name: "", email: "", phone: "", document: "", address: "", client_type_id: "", notes: "" });
      }
      setErrors({});
      setTouched({});
    }
  }, [open, editData]);

  const validate = (f = form): FormErrors => {
    const errs: FormErrors = {};
    if (!f.name.trim()) errs.name = "Nome é obrigatório";
    else if (f.name.trim().length < 2) errs.name = "Nome deve ter pelo menos 2 caracteres";
    else if (f.name.trim().length > 100) errs.name = "Nome deve ter no máximo 100 caracteres";
    const emailErr = validateEmail(f.email);
    if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(f.phone);
    if (phoneErr) errs.phone = phoneErr;
    if (f.document) {
      const digits = f.document.replace(/\D/g, "");
      if (digits.length !== 11 && digits.length !== 14) errs.document = "CPF (11 dígitos) ou CNPJ (14 dígitos)";
    }
    return errs;
  };

  const handleChange = (field: string, value: string) => {
    let formatted = value;
    if (field === "document") formatted = formatDocument(value);
    if (field === "phone") formatted = formatPhone(value);
    const updated = { ...form, [field]: formatted };
    setForm(updated);
    if (touched[field]) {
      setErrors(validate(updated));
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach(k => allTouched[k] = true);
    setTouched(allTouched);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    const payload: any = { name: form.name.trim(), status: "ativo" };
    if (form.email) payload.email = form.email.trim();
    if (form.phone) payload.phone = form.phone.trim();
    if (form.document) payload.document = form.document.trim();
    if (form.address) payload.address = form.address.trim();
    if (form.client_type_id) payload.client_type_id = form.client_type_id;
    if (form.notes) payload.notes = form.notes.trim();
    const ok = await onSubmit(payload);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-bg-primary/95 backdrop-blur-2xl border-white/10 text-white max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-xl tracking-tight">{editData ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription className="text-white/40">Preencha os dados do cliente. Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className={cn("text-[10px] font-heading font-bold uppercase tracking-[0.2em] mb-1.5 block ml-1", errors.name && touched.name ? "text-red-400" : "text-white/30")}>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                className={cn("bg-white/[0.03] border-white/10 rounded-xl h-11 text-xs focus:border-primary/50 transition-all", errors.name && touched.name ? "border-red-400/50" : "")}
                maxLength={100}
              />
              {errors.name && touched.name && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.name}
                </p>
              )}
            </div>
            <div>
              <Label className={errors.email && touched.email ? "text-destructive" : ""}>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                className={errors.email && touched.email ? "border-destructive" : ""}
                maxLength={255}
                placeholder="exemplo@email.com"
              />
              {errors.email && touched.email && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.email}
                </p>
              )}
            </div>
            <div>
              <Label className={errors.phone && touched.phone ? "text-destructive" : ""}>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                onBlur={() => handleBlur("phone")}
                className={errors.phone && touched.phone ? "border-destructive" : ""}
                placeholder="(00) 00000-0000"
                maxLength={16}
              />
              {errors.phone && touched.phone && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.phone}
                </p>
              )}
            </div>
            <div>
              <Label className={errors.document && touched.document ? "text-destructive" : ""}>CPF / CNPJ</Label>
              <Input
                value={form.document}
                onChange={(e) => handleChange("document", e.target.value)}
                onBlur={() => handleBlur("document")}
                className={errors.document && touched.document ? "border-destructive" : ""}
                placeholder="000.000.000-00"
                maxLength={18}
              />
              {errors.document && touched.document && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.document}
                </p>
              )}
            </div>
            <div>
              <Label className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] mb-1.5 block ml-1 text-white/30">Tipo de Cliente</Label>
              <div className="flex gap-2">
                <Select value={form.client_type_id} onValueChange={(v) => setForm({ ...form, client_type_id: v })}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10 rounded-xl h-11 text-xs focus:border-primary/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-bg-secondary border-white/10 text-white backdrop-blur-xl">
                    {clientTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="focus:bg-white/[0.08] cursor-pointer">{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="h-11 w-11 shrink-0 bg-white/[0.03] border-white/10 hover:bg-white/[0.08] rounded-xl"
                  onClick={() => setShowQuickAddType(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                maxLength={255}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{form.notes.length}/1000</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editData ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>

      <QuickAddDialog
        open={showQuickAddType}
        onOpenChange={setShowQuickAddType}
        registryKey="tipos_cliente"
        title="Novo Tipo de Cliente"
        onSuccess={() => (window as any)._refreshClientTypes?.()}
      />
    </Dialog>
  );
}
