import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Plus, Copy, Check, Trash2, Ban, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useApiKeys, CreatedApiKey } from "@/hooks/useApiKeys";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function CreatedKeyDialog({ created, onClose }: { created: CreatedApiKey; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(created.key);
    setCopied(true);
    toast({ title: "Copiado!", description: "Chave copiada para a área de transferência." });
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chave criada</DialogTitle>
          <DialogDescription>
            Guarde esta chave em local seguro. Por segurança, ela <strong>não será exibida novamente</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Sua API key</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted rounded-md px-3 py-2 text-xs font-mono break-all">{created.key}</code>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Concluí, fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApiKeysTab() {
  const { profile } = useAuth();
  const roleName = profile?.roles?.name?.toLowerCase() || "";
  const isAdmin = roleName.includes("admin") || roleName.includes("administrador") || roleName.includes("master") || !!profile?.is_master;

  const { keys, loading, createKey, revokeKey, deleteKey } = useApiKeys();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);

  if (!isAdmin) {
    return (
      <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-heading font-semibold text-lg mb-2">Acesso restrito</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Apenas administradores podem gerenciar as chaves de API da organização.
        </p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const scopes = canWrite ? ["read", "write"] : ["read"];
    const result = await createKey(name.trim(), scopes);
    setCreating(false);
    if (result) {
      setCreated(result);
      setCreateOpen(false);
      setName("");
      setCanWrite(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Chaves de API
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
            Use chaves para integrar sistemas externos via a API REST do Totum.
            Autentique com o header <code className="text-xs">Authorization: Bearer totum_sk_...</code>.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nova chave
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : keys.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma chave de API criada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <motion.div
              key={k.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{k.name}</p>
                  {k.is_active
                    ? <Badge variant="outline" className="text-[hsl(var(--accent-success))] border-[hsl(var(--accent-success))]/30">Ativa</Badge>
                    : <Badge variant="outline" className="text-muted-foreground">Revogada</Badge>}
                  {(k.scopes || []).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px] uppercase">{s}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{k.key_prefix}••••••••</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  Criada {format(new Date(k.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  {k.last_used_at ? ` · último uso ${format(new Date(k.last_used_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}` : " · nunca usada"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {k.is_active && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => revokeKey(k.id)} title="Revogar">
                    <Ban className="h-4 w-4" />
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive" title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir chave?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Qualquer integração usando "{k.name}" deixará de funcionar imediatamente. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteKey(k.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova chave de API</DialogTitle>
            <DialogDescription>Defina um nome e o nível de acesso da chave.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Integração Agendamento" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Permitir escrita</p>
                <p className="text-xs text-muted-foreground">Permite criar e editar projetos/tarefas (POST/PATCH). Sem isso, a chave é somente leitura.</p>
              </div>
              <Switch checked={canWrite} onCheckedChange={setCanWrite} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar chave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {created && <CreatedKeyDialog created={created} onClose={() => setCreated(null)} />}
    </div>
  );
}
