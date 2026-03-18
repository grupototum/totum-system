import { AuditEntry } from "./permissionsData";
import { History, User } from "lucide-react";

interface AuditLogProps {
  entries: AuditEntry[];
}

export function AuditLog({ entries }: AuditLogProps) {
  return (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <div className="glass-card rounded-xl p-12 flex flex-col items-center text-center">
          <History className="h-10 w-10 text-white/15 mb-3" />
          <p className="text-sm text-white/30">Nenhum registro de auditoria</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Data/Hora</th>
                <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Usuário</th>
                <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Ação</th>
                <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="p-3.5 text-xs text-white/50 font-mono whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleDateString("pt-BR")}{" "}
                    {new Date(entry.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-3.5">
                    <span className="text-xs flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full gradient-primary flex items-center justify-center text-[8px] font-bold shrink-0">
                        {entry.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      {entry.userName}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-xs font-medium text-primary">{entry.action}</span>
                  </td>
                  <td className="p-3.5 text-xs text-white/60 max-w-[400px] truncate">{entry.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
