import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { logError } from "@/lib/errorHandler";

interface Props {
  children: ReactNode;
  routeName?: string;
  onReset?: () => void;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
  open: boolean;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null, open: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    // Structured log for debugging in build/runtime
    console.error(
      `[RouteErrorBoundary] ${this.props.routeName ?? "Route"} crashed:`,
      {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "n/a",
      }
    );
    logError(error, `route_crash:${this.props.routeName ?? "unknown"}`);
  }

  reset = () => {
    this.setState({ error: null, info: null, open: false });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const { error, info, open } = this.state;
    const details = [
      `Rota: ${this.props.routeName ?? "desconhecida"}`,
      `URL: ${typeof window !== "undefined" ? window.location.href : "n/a"}`,
      `Mensagem: ${error.message}`,
      "",
      "Stack:",
      error.stack ?? "(sem stack)",
      "",
      "Component stack:",
      info?.componentStack ?? "(indisponível)",
    ].join("\n");

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-destructive/40">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Algo deu errado nesta tela</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                A renderização falhou. Você pode tentar novamente ou voltar.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm font-mono break-words">
              {error.message || "Erro desconhecido"}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={this.reset} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
              </Button>
              <Button onClick={() => window.history.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button
                onClick={() => navigator.clipboard?.writeText(details)}
                variant="ghost"
              >
                Copiar detalhes
              </Button>
            </div>

            <Collapsible
              open={open}
              onOpenChange={(o) => this.setState({ open: o })}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  Detalhes técnicos
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                  {details}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default RouteErrorBoundary;
