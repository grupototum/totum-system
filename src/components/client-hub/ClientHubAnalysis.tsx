import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

interface Props {
  clientId: string;
  initialAnalysis: string;
}

export function ClientHubAnalysis({ clientId, initialAnalysis }: Props) {
  const [content, setContent] = useState(initialAnalysis);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(initialAnalysis);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (content === lastSaved) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaving(true);
      const { error } = await supabase
        .from("clients")
        .update({ marketing_analysis: content } as any)
        .eq("id", clientId);
      setSaving(false);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      } else {
        setLastSaved(content);
      }
    }, 2000);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [content, clientId, lastSaved]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Análise de Marketing</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saving ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</>
          ) : content !== lastSaved ? (
            "Alterações não salvas"
          ) : (
            <><Save className="h-3 w-3" /> Salvo</>
          )}
        </div>
      </div>
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Escreva a análise inicial do cliente aqui. O conteúdo será salvo automaticamente..."
        rows={15}
        className="bg-white/[0.04] border-border resize-y min-h-[300px]"
      />
    </div>
  );
}
