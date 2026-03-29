import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Package, Plus } from "lucide-react";
import { QuickAddDialog } from "@/components/shared/QuickAddDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<boolean>;
  editData?: any | null;
  defaultClientId?: string;
}

interface FormErrors {
  title?: string;
  client_id?: string;
  value?: string;
  start_date?: string;
}

interface ProductOption {
  id: string;
  name: string;
  price: number | null;
  product_type?: { name: string } | null;
}

export function ContractFormDialog({ open, onOpenChange, onSubmit, editData, defaultClientId }: Props) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [plans, setPlans] = useState<{ id: string; name: string; value: number | null; frequency: string }[]>([]);
  const [contractTypes, setContractTypes] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [quickAddClientOpen, setQuickAddClientOpen] = useState(false);
  const [quickAddPlanOpen, setQuickAddPlanOpen] = useState(false);
  const [quickAddTypeOpen, setQuickAddTypeOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", client_id: "", plan_id: "", contract_type_id: "",
    value: "", billing_frequency: "mensal" as string,
    start_date: "", end_date: "", notes: "",
  });

  useEffect(() => {
    if (open) {
      Promise.all([
        supabase.from("clients").select("id, name").eq("status", "ativo").order("name"),
        supabase.from("plans").select("id, name, value, frequency").eq("is_active", true).order("name"),
        supabase.from("contract_types").select("id, name").eq("is_active", true).order("name"),
        supabase.from("products").select("id, name, price, product_types(name)").eq("is_active", true).order("name"),
      ]).then(([c, p, ct, pr]) => {
        setClients(c.data || []);
        setPlans((p.data as any) || []);
        setContractTypes(ct.data || []);
        setProducts((pr.data as any) || []);
      });

      if (editData) {
        setForm({
          title: editData.title || "",
          client_id: editData.client_id || "",
          plan_id: editData.plan_id || "",
          contract_type_id: editData.contract_type_id || "",
          value: editData.value ? String(editData.value) : "",
          billing_frequency: editData.billing_frequency || "mensal",
          start_date: editData.start_date || "",
          end_date: editData.end_date || "",
          notes: editData.notes || "",
        });
      } else {
        setForm({ title: "", client_id: defaultClientId || "", plan_id: "", contract_type_id: "", value: "", billing_frequency: "mensal", start_date: "", end_date: "", notes: "" });
      }
      setSelectedProducts([]);
      setErrors({});
      setTouched({});
    }
  }, [open, editData]);

  const validate = (f = form): FormErrors => {
    const errs: FormErrors = {};
    if (!f.title.trim()) errs.title = "Título é obrigatório";
    else if (f.title.trim().length < 3) errs.title = "Título deve ter pelo menos 3 caracteres";
    if (!f.client_id) errs.client_id = "Selecione um cliente";
    if (f.value && Number(f.value) < 0) errs.value = "Valor não pode ser negativo";
    if (f.start_date && f.end_date && f.end_date < f.start_date) errs.start_date = "Data início deve ser anterior à data fim";
    return errs;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    setErrors(validate());
  };

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    setForm({
      ...form,
      plan_id: planId,
      value: plan?.value ? String(plan.value) : form.value,
      billing_frequency: plan?.frequency || form.billing_frequency,
    });
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const productsTotal = selectedProducts.reduce((sum, id) => {
    const p = products.find((pr) => pr.id === id);
    return sum + (p?.price || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach(k => allTouched[k] = true);
    setTouched(allTouched);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    const payload: any = {
      title: form.title.trim(),
      client_id: form.client_id,
      status: "ativo",
      billing_frequency: form.billing_frequency,
    };
    if (form.plan_id) payload.plan_id = form.plan_id;
    if (form.contract_type_id) payload.contract_type_id = form.contract_type_id;
    // Use manual value or sum from products
    const finalValue = form.value ? Number(form.value) : productsTotal > 0 ? productsTotal : undefined;
    if (finalValue !== undefined) payload.value = finalValue;
    if (form.start_date) payload.start_date = form.start_date;
    if (form.end_date) payload.end_date = form.end_date;
    if (form.notes) {
      let notesText = form.notes.trim();
      if (selectedProducts.length > 0) {
        const productNames = selectedProducts.map(id => products.find(p => p.id === id)?.name).filter(Boolean);
        notesText += `\n\nProdutos vinculados: ${productNames.join(", ")}`;
      }
      payload.notes = notesText;
    } else if (selectedProducts.length > 0) {
      const productNames = selectedProducts.map(id => products.find(p => p.id === id)?.name).filter(Boolean);
      payload.notes = `Produtos vinculados: ${productNames.join(", ")}`;
    }

    const ok = await onSubmit(payload);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  const selectedPlan = plans.find(p => p.id === form.plan_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          <DialogDescription>Configure o contrato com pacote e produtos vinculados.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className={errors.title && touched.title ? "text-destructive" : ""}>Título do Contrato *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onBlur={() => handleBlur("title")}
                className={errors.title && touched.title ? "border-destructive" : ""}
                placeholder="Ex: Contrato Mensal - Cliente X"
                maxLength={200}
              />
              {errors.title && touched.title && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.title}
                </p>
              )}
            </div>
            <div>
              <Label className={`flex items-center justify-between ${errors.client_id && touched.client_id ? "text-destructive" : ""}`}>
                Cliente *
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 text-primary"
                  onClick={() => setQuickAddClientOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </Label>
              <Select value={form.client_id} onValueChange={(v) => { setForm({ ...form, client_id: v }); setTouched({ ...touched, client_id: true }); }}>
                <SelectTrigger className={errors.client_id && touched.client_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.client_id && touched.client_id && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.client_id}
                </p>
              )}
            </div>
            <div>
              <Label className="flex items-center justify-between">
                Tipo de Contrato
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 text-primary"
                  onClick={() => setQuickAddTypeOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </Label>
              <Select value={form.contract_type_id} onValueChange={(v) => setForm({ ...form, contract_type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {contractTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Plan Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center justify-between">
              Pacote
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 text-primary"
                onClick={() => setQuickAddPlanOpen(true)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </Label>
            <Select value={form.plan_id} onValueChange={handlePlanChange}>
              <SelectTrigger><SelectValue placeholder="Vincular a um pacote (opcional)" /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.value ? `— R$ ${Number(p.value).toLocaleString("pt-BR")}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlan && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs space-y-1">
                <p><strong>Pacote selecionado:</strong> {selectedPlan.name}</p>
                {selectedPlan.value && <p><strong>Valor sugerido:</strong> R$ {Number(selectedPlan.value).toLocaleString("pt-BR")}</p>}
                <p><strong>Frequência:</strong> {selectedPlan.frequency}</p>
              </div>
            )}
          </div>

          {/* Products Section */}
          {products.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" /> Produtos / Serviços Vinculados
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-lg border border-border p-3">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedProducts.includes(product.id) ? "bg-primary/10 border border-primary/30" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(product.product_type as any)?.name || "Produto"}
                        {product.price ? ` · R$ ${Number(product.price).toLocaleString("pt-BR")}` : ""}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedProducts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedProducts.length} produto(s) selecionado(s) · Total: <strong className="text-foreground">R$ {productsTotal.toLocaleString("pt-BR")}</strong>
                </p>
              )}
            </div>
          )}

          {/* Financial */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className={errors.value && touched.value ? "text-destructive" : ""}>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                onBlur={() => handleBlur("value")}
                className={errors.value && touched.value ? "border-destructive" : ""}
                placeholder={productsTotal > 0 ? `Auto: ${productsTotal.toLocaleString("pt-BR")}` : "0.00"}
              />
              {errors.value && touched.value && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.value}
                </p>
              )}
            </div>
            <div>
              <Label>Frequência</Label>
              <Select value={form.billing_frequency} onValueChange={(v) => setForm({ ...form, billing_frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="personalizada">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={errors.start_date && touched.start_date ? "text-destructive" : ""}>Data Início</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                onBlur={() => handleBlur("start_date")}
                className={errors.start_date && touched.start_date ? "border-destructive" : ""}
              />
              {errors.start_date && touched.start_date && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.start_date}
                </p>
              )}
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{form.notes.length}/1000</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editData ? "Atualizar" : "Criar Contrato"}
            </Button>
          </div>
        </form>
        <QuickAddDialog
          open={quickAddClientOpen}
          onOpenChange={setQuickAddClientOpen}
          registryKey="fornecedores"
          title="Novo Cliente"
          onSuccess={(id, name) => {
            setClients([...clients, { id, name }].sort((a, b) => a.name.localeCompare(b.name)));
            setForm({ ...form, client_id: id });
          }}
        />
        <QuickAddDialog
          open={quickAddPlanOpen}
          onOpenChange={setQuickAddPlanOpen}
          registryKey="planos"
          title="Novo Pacote"
          onSuccess={(id, name) => {
            setPlans([...plans, { id, name, value: null, frequency: "mensal" }].sort((a, b) => a.name.localeCompare(b.name)));
            setForm({ ...form, plan_id: id });
          }}
        />
        <QuickAddDialog
          open={quickAddTypeOpen}
          onOpenChange={setQuickAddTypeOpen}
          registryKey="tipos_contrato"
          title="Novo Tipo de Contrato"
          onSuccess={(id, name) => {
            setContractTypes([...contractTypes, { id, name }].sort((a, b) => a.name.localeCompare(b.name)));
            setForm({ ...form, contract_type_id: id });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
