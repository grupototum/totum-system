import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Check, Copy, RefreshCw } from "lucide-react";

export interface TenantScopeDiagnostics {
  /** Hostname usado para resolver a organização (window.location.host normalizado). */
  host: string;
  /** match_type devolvido por resolve_organization_by_host ("exact", "fallback"...). */
  matchType?: string | null;
  /** organization_id resolvido pelo host. null = organização não identificada. */
  tenantOrganizationId?: string | null;
  /** organization_id gravado no perfil do usuário logado. */
  profileOrganizationId?: string | null;
  userEmail?: string | null;
  isMaster?: boolean | null;
  /** Mensagem crua devolvida pelo Postgres, quando o erro veio do banco. */
  dbMessage?: string | null;
  dbCode?: string | null;
}

interface TenantScopeErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nome do registro que o usuário tentou criar, em minúsculas. Ex.: "tarefa". */
  entityLabel: string;
  diagnostics: TenantScopeDiagnostics;
  /** Reexecuta a resolução de tenant (useTenant().refresh). */
  onRetry?: () => void | Promise<void>;
}

function buildDiagnosticsText(entityLabel: string, d: TenantScopeDiagnostics) {
  return [
    `Totum System — diagnóstico de escopo de organização`,
    `Registro: ${entityLabel}`,
    `Host: ${d.host || "—"}`,
    `Match type: ${d.matchType ?? "—"}`,
    `Organização do host: ${d.tenantOrganizationId ?? "NÃO IDENTIFICADA"}`,
    `Organização do perfil: ${d.profileOrganizationId ?? "NÃO VINCULADA"}`,
    `Usuário: ${d.userEmail ?? "—"}${d.isMaster ? " (master)" : ""}`,
    d.dbCode ? `Código Postgres: ${d.dbCode}` : null,
    d.dbMessage ? `Mensagem do banco: ${d.dbMessage}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Janela de erro operacional para bloqueios de escopo multi-tenant.
 *
 * Aparece quando o registro não pode ser gravado porque o sistema não sabe a
 * qual organização ele pertence — seja porque o host não resolveu nenhuma
 * organização, seja porque o banco recusou a linha via RLS (42501). Em vez do
 * texto cru do Postgres, mostra o procedimento operacional correto.
 */
export function TenantScopeErrorDialog({
  open,
  onOpenChange,
  entityLabel,
  diagnostics,
  onRetry,
}: TenantScopeErrorDialogProps) {
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const noTenantOrg = !diagnostics.tenantOrganizationId;
  const noProfileOrg = !diagnostics.profileOrganizationId;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildDiagnosticsText(entityLabel, diagnostics));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Copie os dados do diagnóstico manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
      toast({
        title: "Contexto recarregado",
        description: "Tente salvar novamente. Se o erro repetir, siga o passo 2.",
      });
      onOpenChange(false);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            Gravação bloqueada pelo banco
          </DialogTitle>
          <DialogDescription>
            A {entityLabel} não foi criada. O banco recusou o registro pela regra de
            isolamento entre organizações (RLS): a organização do registro não bate
            com a organização vinculada ao seu usuário.{" "}
            <strong className="text-foreground">Nenhum dado foi perdido</strong> — o
            formulário continua preenchido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <p className="mb-2 font-medium text-foreground">
              Procedimento operacional correto
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>
                Clique em <strong className="text-foreground">Recarregar contexto</strong>{" "}
                abaixo e tente salvar de novo — se a organização ainda estava
                carregando, isso resolve.
              </li>
              <li>
                Se repetir: saia e entre novamente (logout/login). A sessão pode
                estar presa a um vínculo antigo de organização.
              </li>
              <li>
                Confirme que está no <strong className="text-foreground">endereço oficial
                da sua organização</strong> (ex.:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">totum.pixelsystem.online</code>).
                Endereços de teste (<code className="rounded bg-muted px-1 py-0.5 text-xs">localhost</code>,
                preview <code className="rounded bg-muted px-1 py-0.5 text-xs">*.vercel.app</code>)
                não identificam a organização.
              </li>
              <li>
                Persistindo, copie o diagnóstico abaixo e envie ao administrador. Ele
                precisa conferir, para o seu usuário, se{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">profiles.organization_id</code>{" "}
                é igual à organização do host, e revisar as policies de INSERT da
                tabela <code className="rounded bg-muted px-1 py-0.5 text-xs">tasks</code>.
              </li>
            </ol>
          </div>

          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Diagnóstico
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
              <dt className="text-muted-foreground">host</dt>
              <dd className="break-all text-foreground">{diagnostics.host || "—"}</dd>
              <dt className="text-muted-foreground">match</dt>
              <dd className="break-all text-foreground">{diagnostics.matchType ?? "—"}</dd>
              <dt className="text-muted-foreground">org (host)</dt>
              <dd className={`break-all ${noTenantOrg ? "text-destructive" : "text-foreground"}`}>
                {diagnostics.tenantOrganizationId ?? "não identificada"}
              </dd>
              <dt className="text-muted-foreground">org (perfil)</dt>
              <dd className={`break-all ${noProfileOrg ? "text-destructive" : "text-foreground"}`}>
                {diagnostics.profileOrganizationId ?? "não vinculada"}
              </dd>
              <dt className="text-muted-foreground">usuário</dt>
              <dd className="break-all text-foreground">
                {diagnostics.userEmail ?? "—"}
                {diagnostics.isMaster ? " (master)" : ""}
              </dd>
              {diagnostics.dbMessage ? (
                <>
                  <dt className="text-muted-foreground">banco</dt>
                  <dd className="break-all text-foreground">
                    {diagnostics.dbCode ? `[${diagnostics.dbCode}] ` : ""}
                    {diagnostics.dbMessage}
                  </dd>
                </>
              ) : null}
            </dl>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copiado" : "Copiar diagnóstico"}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {onRetry ? (
              <Button type="button" onClick={handleRetry} disabled={retrying}>
                <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
                Recarregar contexto
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
