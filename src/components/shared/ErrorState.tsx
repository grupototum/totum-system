import { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

/**
 * Estado de erro inline para listas/seções (não para crashes globais).
 * Para crashes use RouteErrorBoundary.
 */
export function ErrorState({
  title = "Algo deu errado",
  description = "Não foi possível carregar este conteúdo. Tente novamente.",
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-10 px-6 rounded-xl border border-destructive/30 bg-destructive/5",
        className
      )}
    >
      <div className="p-3 rounded-full bg-destructive/10 text-destructive mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      <div className="mt-4 flex items-center gap-2">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

export default ErrorState;
