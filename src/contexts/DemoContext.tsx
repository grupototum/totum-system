import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

interface DemoContextType {
  isDemoMode: boolean;
  enableDemo: () => void;
  disableDemo: () => void;
  toggleDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  enableDemo: () => {},
  disableDemo: () => {},
  toggleDemo: () => {},
});

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const enableDemo = useCallback(() => {
    setIsDemoMode(true);
    toast({
      title: "🎭 Modo Demonstração Ativado",
      description: "Todos os dados exibidos são fictícios. Nenhuma alteração será salva.",
    });
  }, []);

  const disableDemo = useCallback(() => {
    setIsDemoMode(false);
    toast({
      title: "Modo Demonstração Desativado",
      description: "Dados reais restaurados.",
    });
  }, []);

  const toggleDemo = useCallback(() => {
    setIsDemoMode(prev => {
      const next = !prev;
      toast({
        title: next ? "🎭 Modo Demonstração Ativado" : "Modo Demonstração Desativado",
        description: next
          ? "Todos os dados exibidos são fictícios. Nenhuma alteração será salva."
          : "Dados reais restaurados.",
      });
      return next;
    });
  }, []);

  return (
    <DemoContext.Provider value={{ isDemoMode, enableDemo, disableDemo, toggleDemo }}>
      {children}
    </DemoContext.Provider>
  );
}
