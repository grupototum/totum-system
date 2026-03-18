import { useDemo } from "@/contexts/DemoContext";
import { Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoBanner() {
  const { isDemoMode, disableDemo } = useDemo();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-black px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium relative z-50">
      <Monitor className="h-4 w-4" />
      <span>Modo Demonstração Ativo — Todos os dados são fictícios</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={disableDemo}
        className="h-6 px-2 text-black/70 hover:text-black hover:bg-black/10 gap-1 text-xs"
      >
        <X className="h-3 w-3" />
        Sair
      </Button>
    </div>
  );
}
