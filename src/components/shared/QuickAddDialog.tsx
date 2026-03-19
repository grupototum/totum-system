import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRegistryData } from "@/hooks/useRegistryData";

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registryKey: string; // Key used in useRegistryData map
  title: string;
  onSuccess?: (newItemId: string, newItemName: string) => void;
}

export function QuickAddDialog({ open, onOpenChange, registryKey, title, onSuccess }: QuickAddDialogProps) {
  const { addItem } = useRegistryData(registryKey);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setSaving(true);
    // addItem returns boolean and handles toast/loading internally (mostly)
    // but we need to fetch the new item if we want to auto-select it.
    // useRegistryData doesn't return the ID easily from addItem.
    // Let's refine this if needed, or just let the user re-select.
    const ok = await addItem({ name: name.trim() });
    setSaving(false);
    
    if (ok) {
      setName("");
      onOpenChange(false);
      if (onSuccess) onSuccess("", name.trim()); // We don't have the ID easily here without refactoring useRegistryData
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-bg-secondary/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-xl">{title}</DialogTitle>
          <DialogDescription className="text-white/40">
            Adicione rapidamente um novo registro para continuar seu trabalho.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-2">
            <Label className="font-heading font-bold text-[10px] uppercase tracking-[0.2em] text-white/30 ml-1">Nome</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Digite o nome..." 
              className="bg-white/[0.03] border-white/10 rounded-xl h-11 focus:border-primary/50 transition-all"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl h-11">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="rounded-xl h-11 px-6">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
