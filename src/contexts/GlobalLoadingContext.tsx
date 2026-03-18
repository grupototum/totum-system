import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingState {
  isLoading: boolean;
  message: string;
}

interface GlobalLoadingContextType {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  isLoading: boolean;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType>({
  startLoading: () => {},
  stopLoading: () => {},
  isLoading: false,
});

export const useGlobalLoading = () => useContext(GlobalLoadingContext);

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadingState>({ isLoading: false, message: "Carregando..." });

  const startLoading = useCallback((message = "Carregando...") => {
    setState({ isLoading: true, message });
  }, []);

  const stopLoading = useCallback(() => {
    setState({ isLoading: false, message: "" });
  }, []);

  return (
    <GlobalLoadingContext.Provider value={{ startLoading, stopLoading, isLoading: state.isLoading }}>
      {children}
      <AnimatePresence>
        {state.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4 min-w-[240px]"
            >
              <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-foreground/80">{state.message}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlobalLoadingContext.Provider>
  );
}
