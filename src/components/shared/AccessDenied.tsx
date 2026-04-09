import { Shield } from "lucide-react";

interface AccessDeniedProps {
  title?: string;
  message?: string;
}

export function AccessDenied({
  title = "Acesso restrito",
  message = "Você não tem permissão para acessar este módulo. Entre em contato com um administrador.",
}: AccessDeniedProps) {
  return (
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto">
      <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
    </div>
  );
}
