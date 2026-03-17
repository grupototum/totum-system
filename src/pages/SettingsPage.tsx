import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-white/50 mt-1">Configurações do sistema</p>
      </div>
      <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <Settings className="h-12 w-12 text-white/20 mb-4" />
        <h3 className="font-heading font-semibold text-lg mb-2">Em breve</h3>
        <p className="text-sm text-white/40 max-w-md">
          Configurações de webhooks, integrações, gateways de pagamento e automações serão disponibilizadas aqui.
        </p>
      </div>
    </div>
  );
}
