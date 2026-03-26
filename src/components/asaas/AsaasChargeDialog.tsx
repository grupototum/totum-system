import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, QrCode, FileText, ExternalLink, Copy, Check } from "lucide-react";
import { useAsaasConfig, useCreateAsaasPayment, useAsaasCustomerMapping } from "@/hooks/useAsaas";
import { toast } from "@/hooks/use-toast";

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

  const [billingType, setBillingType] = useState<"BOLETO" | "PIX" | "CREDIT_CARD" | "UNDEFINED">(
    config?.default_billing_type || "BOLETO"
  );
  const [value, setValue] = useState(defaultValue?.toString() || "");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [description, setDescription] = useState(defaultDescription || "");
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!config?.api_key) {
      toast({ title: "Asaas não configurado", description: "Configure a integração Asaas primeiro.", variant: "destructive" });
      return;
    }
    if (!mapping?.asaas_customer_id) {
      toast({ title: "Cliente não sincronizado", description: "Sincronize o cliente com o Asaas primeiro.", variant: "destructive" });
      return;
    }
    if (!value || isNaN(Number(value))) {
      toast({ title: "Valor inválido", description: "Informe um valor válido.", variant: "destructive" });
      return;
    }

    const payment = await createPayment.mutateAsync({
      input: {
        customer: mapping.asaas_customer_id,
        billingType,
        value: Number(value),
        dueDate,
        description: description || `Cobrança - ${clientName}`,
        externalReference: contractId || clientId,
      },
      apiKey: config.api_key,
      contractId,
      clientId,
    });

    setResult(payment);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Gerar Cobrança — {clientName}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          // Resultado da cobrança criada
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Cobrança criada com sucesso!
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(result.value)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vencimento</span>
                <span>{new Date(result.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}</span>
              </div>
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
          // Formulário de criação
          <div className="space-y-4 py-2">
            {!mapping?.asaas_customer_id && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
                Este cliente ainda não foi sincronizado com o Asaas. Sincronize-o primeiro na aba de cobranças da central do cliente.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
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
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>

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
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Fechar" : "Cancelar"}
          </Button>
          {!result && (
            <Button
              onClick={handleSubmit}
              disabled={createPayment.isPending || !mapping?.asaas_customer_id}
              className="gradient-primary text-white"
            >
              {createPayment.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
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
