import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CreditCard, QrCode, FileText, ExternalLink, Copy, Check, RotateCcw } from "lucide-react";
import { useAsaasConfig, useCreateAsaasPayment, useCreateAsaasSubscription, useAsaasCustomerMapping } from "@/hooks/useAsaas";
import { toast } from "@/hooks/use-toast";
import type { AsaasBillingType, AsaasSubscriptionCycle } from "@/services/asaasService";

interface AsaasChargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  contractId?: string;
  defaultValue?: number;
  defaultDescription?: string;
}

export function AsaasChargeDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  contractId,
  defaultValue,
  defaultDescription,
}: AsaasChargeDialogProps) {
  const { data: config } = useAsaasConfig();
  const { data: mapping } = useAsaasCustomerMapping(clientId);
  const createPayment = useCreateAsaasPayment();
  const createSubscription = useCreateAsaasSubscription();

  const [tab, setTab] = useState<"avulsa" | "parcelada" | "assinatura">("avulsa");
  const [billingType, setBillingType] = useState<AsaasBillingType>(config?.default_billing_type || "BOLETO");
  const [value, setValue] = useState(defaultValue?.toString() || "");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [description, setDescription] = useState(defaultDescription || "");
  
  // Parcelamento
  const [installmentCount, setInstallmentCount] = useState("2");
  
  // Assinatura
  const [cycle, setCycle] = useState<AsaasSubscriptionCycle>("MONTHLY");
  const [maxPayments, setMaxPayments] = useState("");
  
  // Multa, juros e desconto
  const [enableFine, setEnableFine] = useState(false);
  const [fineValue, setFineValue] = useState("2");
  const [enableInterest, setEnableInterest] = useState(false);
  const [interestValue, setInterestValue] = useState("1");
  const [enableDiscount, setEnableDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("PERCENTAGE");

  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!config?.api_key) {
      toast({ title: "Asaas não configurado", description: "Configure a integração Asaas primeiro.", variant: "destructive" });
      return;
    }
    if (!(mapping as any)?.asaas_customer_id) {
      toast({ title: "Cliente não sincronizado", description: "Sincronize o cliente com o Asaas primeiro.", variant: "destructive" });
      return;
    }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      toast({ title: "Valor inválido", description: "Informe um valor válido maior que zero.", variant: "destructive" });
      return;
    }

    const asaasCustomerId = (mapping as any).asaas_customer_id;
    const discount = enableDiscount && discountValue ? { value: Number(discountValue), type: discountType } : undefined;
    const interest = enableInterest ? { value: Number(interestValue) } : undefined;
    const fine = enableFine ? { value: Number(fineValue), type: "PERCENTAGE" as const } : undefined;

    try {
      if (tab === "assinatura") {
        const sub = await createSubscription.mutateAsync({
          input: {
            customer: asaasCustomerId,
            billingType,
            value: Number(value),
            nextDueDate: dueDate,
            cycle,
            description: description || `Assinatura - ${clientName}`,
            maxPayments: maxPayments ? Number(maxPayments) : undefined,
            externalReference: contractId || clientId,
            discount,
            interest,
            fine,
          },
          apiKey: config.api_key,
          contractId,
          clientId,
        });
        setResult({ ...sub, _type: "subscription" });
      } else {
        const numValue = Number(value);
        const count = tab === "parcelada" ? Number(installmentCount) : undefined;
        
        const payment = await createPayment.mutateAsync({
          input: {
            customer: asaasCustomerId,
            billingType,
            value: tab === "parcelada" ? numValue : numValue,
            dueDate,
            description: description || `Cobrança - ${clientName}`,
            externalReference: contractId || clientId,
            installmentCount: count,
            totalValue: tab === "parcelada" ? numValue : undefined,
            discount,
            interest,
            fine,
          },
          apiKey: config.api_key,
          contractId,
          clientId,
        });
        setResult(payment);
      }
    } catch {
      // Error handled by mutation
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setResult(null);
    setValue(defaultValue?.toString() || "");
    setDescription(defaultDescription || "");
    onOpenChange(false);
  };

  if (!config?.is_active) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Integração Asaas</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            <p>A integração com o Asaas não está configurada.</p>
            <p className="text-sm mt-1">Acesse Configurações → Integrações para ativar.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Gerar Cobrança — {clientName}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {result._type === "subscription" ? "Assinatura criada com sucesso!" : "Cobrança criada com sucesso!"}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-semibold">{fmt(result.value)}</span>
              </div>
              {result._type === "subscription" ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ciclo</span>
                  <Badge variant="outline">{cycle}</Badge>
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vencimento</span>
                  <span>{new Date(result.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo</span>
                <Badge variant="outline">{billingType}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              {result.invoiceUrl && (
                <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                  <a href={result.invoiceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Abrir fatura
                  </a>
                </Button>
              )}
              {result.bankSlipUrl && (
                <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                  <a href={result.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" />
                    Baixar boleto PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {!(mapping as any)?.asaas_customer_id && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
                Este cliente ainda não foi sincronizado com o Asaas. Sincronize-o primeiro.
              </div>
            )}

            {/* Tipo de cobrança */}
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="avulsa" className="flex-1 gap-1.5 text-xs">
                  <CreditCard className="h-3.5 w-3.5" /> Avulsa
                </TabsTrigger>
                <TabsTrigger value="parcelada" className="flex-1 gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" /> Parcelada
                </TabsTrigger>
                <TabsTrigger value="assinatura" className="flex-1 gap-1.5 text-xs">
                  <RotateCcw className="h-3.5 w-3.5" /> Assinatura
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{tab === "parcelada" ? "Valor total (R$)" : "Valor (R$)"}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{tab === "assinatura" ? "Primeiro vencimento" : "Vencimento"}</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Parcelamento */}
            {tab === "parcelada" && (
              <div className="space-y-1.5">
                <Label>Número de parcelas</Label>
                <Select value={installmentCount} onValueChange={setInstallmentCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => i + 2).map(n => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x de {value ? fmt(Number(value) / n) : "..."}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Ciclo de assinatura */}
            {tab === "assinatura" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Periodicidade</Label>
                  <Select value={cycle} onValueChange={(v) => setCycle(v as AsaasSubscriptionCycle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                      <SelectItem value="BIMONTHLY">Bimestral</SelectItem>
                      <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                      <SelectItem value="SEMIANNUALLY">Semestral</SelectItem>
                      <SelectItem value="YEARLY">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Máx. cobranças (opcional)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={maxPayments}
                    onChange={e => setMaxPayments(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={billingType} onValueChange={(v: any) => setBillingType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOLETO">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Boleto bancário
                    </div>
                  </SelectItem>
                  <SelectItem value="PIX">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" /> Pix
                    </div>
                  </SelectItem>
                  <SelectItem value="CREDIT_CARD">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Cartão de crédito
                    </div>
                  </SelectItem>
                  <SelectItem value="UNDEFINED">Deixar cliente escolher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição da cobrança..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Multa, juros e desconto */}
            <div className="space-y-3 pt-1 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">Condições de pagamento</p>
              
              {/* Multa */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">Multa por atraso</Label>
                  <p className="text-xs text-muted-foreground">Aplicada após o vencimento</p>
                </div>
                <Switch checked={enableFine} onCheckedChange={setEnableFine} />
              </div>
              {enableFine && (
                <div className="flex gap-2 pl-4">
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={fineValue}
                    onChange={e => setFineValue(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground self-center">%</span>
                </div>
              )}

              {/* Juros */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">Juros ao mês</Label>
                  <p className="text-xs text-muted-foreground">Percentual mensal sobre o valor</p>
                </div>
                <Switch checked={enableInterest} onCheckedChange={setEnableInterest} />
              </div>
              {enableInterest && (
                <div className="flex gap-2 pl-4">
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={interestValue}
                    onChange={e => setInterestValue(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground self-center">% ao mês</span>
                </div>
              )}

              {/* Desconto */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">Desconto para pagamento antecipado</Label>
                  <p className="text-xs text-muted-foreground">Aplicado até a data de vencimento</p>
                </div>
                <Switch checked={enableDiscount} onCheckedChange={setEnableDiscount} />
              </div>
              {enableDiscount && (
                <div className="flex gap-2 pl-4">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    className="w-24"
                    placeholder="0"
                  />
                  <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">%</SelectItem>
                      <SelectItem value="FIXED">R$ fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Fechar" : "Cancelar"}
          </Button>
          {!result && (
            <Button
              onClick={handleSubmit}
              disabled={
                createPayment.isPending || 
                createSubscription.isPending || 
                !(mapping as any)?.asaas_customer_id
              }
              className="gradient-primary text-white"
            >
              {(createPayment.isPending || createSubscription.isPending) ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
              ) : tab === "assinatura" ? (
                <><RotateCcw className="h-4 w-4 mr-2" /> Criar assinatura</>
              ) : (
                <><CreditCard className="h-4 w-4 mr-2" /> Gerar cobrança</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
