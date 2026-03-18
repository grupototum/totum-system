import { useState } from "react";
import { Loader2, Filter, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuditLogs, useErrorLogs } from "@/hooks/useAdminSettings";
import { useProfiles } from "@/hooks/useProfiles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ENTITY_TYPES = [
  { value: "all", label: "Todos" },
  { value: "auth", label: "Autenticação" },
  { value: "profile", label: "Perfil" },
  { value: "client", label: "Clientes" },
  { value: "contract", label: "Contratos" },
  { value: "task", label: "Tarefas" },
  { value: "financial", label: "Financeiro" },
  { value: "config", label: "Configurações" },
];

function AuditSection() {
  const [entityType, setEntityType] = useState("all");
  const { data: logs, isLoading } = useAuditLogs({
    entityType: entityType === "all" ? undefined : entityType,
    limit: 200,
  });
  const { profiles } = useProfiles();

  const getProfileName = (userId: string | null) => {
    if (!userId || !profiles) return "Sistema";
    const p = profiles.find((pr: any) => pr.user_id === userId);
    return p?.full_name || "Desconhecido";
  };

  const getActionColor = (action: string) => {
    if (action.includes("delete") || action.includes("remove")) return "destructive";
    if (action.includes("create") || action.includes("insert") || action.includes("login")) return "default";
    if (action.includes("update") || action.includes("change")) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando logs...</span>
        </div>
      ) : !logs?.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum log encontrado.</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
          {logs.map((log: any) => (
            <div key={log.id} className="glass-card rounded-lg px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getActionColor(log.action)} className="text-[10px]">
                    {log.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{log.entity_type}</span>
                </div>
                <p className="text-sm mt-1 truncate">{log.detail || "—"}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span>{getProfileName(log.user_id)}</span>
                  <span>
                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorSection() {
  const { data: errors, isLoading } = useErrorLogs();

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando erros...</span>
        </div>
      ) : !errors?.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum erro registrado. 🎉</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
          {errors.map((err: any) => (
            <div key={err.id} className="glass-card rounded-lg px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <Badge variant="destructive" className="text-[10px]">{err.error_type}</Badge>
                <span className="text-[11px] text-muted-foreground">
                  {format(new Date(err.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <p className="text-sm">{err.message}</p>
              {err.context && <p className="text-xs text-muted-foreground">Contexto: {err.context}</p>}
              {err.technical_message && (
                <details className="text-xs text-muted-foreground/60">
                  <summary className="cursor-pointer">Detalhes técnicos</summary>
                  <pre className="mt-1 text-[10px] whitespace-pre-wrap break-all">{err.technical_message}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AuditLogsTab() {
  return (
    <Tabs defaultValue="audit" className="space-y-4">
      <TabsList className="bg-card border border-border">
        <TabsTrigger value="audit">Ações de Usuários</TabsTrigger>
        <TabsTrigger value="errors">Erros do Sistema</TabsTrigger>
      </TabsList>

      <TabsContent value="audit">
        <div className="glass-card rounded-xl p-6">
          <AuditSection />
        </div>
      </TabsContent>

      <TabsContent value="errors">
        <div className="glass-card rounded-xl p-6">
          <ErrorSection />
        </div>
      </TabsContent>
    </Tabs>
  );
}
