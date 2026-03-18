import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MoreHorizontal, ArrowUpDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClients, ClientRow } from "@/hooks/useClients";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";

const statusConfig: Record<string, string> = {
  ativo: "status-active",
  pausado: "status-paused",
  cancelado: "status-cancelled",
  inativo: "status-cancelled",
};

export default function Clients() {
  const { clients, loading, addClient } = useClients();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getActivePlan = (c: ClientRow) => {
    const active = (c.contracts || []).find((ct) => ct.status === "ativo");
    return active?.plans?.name || "—";
  };

  const getMrr = (c: ClientRow) => {
    return (c.contracts || [])
      .filter((ct) => ct.status === "ativo")
      .reduce((s, ct) => s + (Number(ct.value) || 0), 0);
  };

  const activeCount = clients.filter((c) => c.status === "ativo").length;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-white/50 mt-1">{activeCount} ativos · {clients.length} total</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gradient-primary border-0 text-white font-semibold gap-2 rounded-full px-5">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/[0.05] border-white/[0.1] rounded-xl h-10 text-sm placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Cliente</th>
                  <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Tipo</th>
                  <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Plano</th>
                  <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-white/60">MRR <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Contato</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-white/30">Nenhum cliente encontrado</td></tr>
                ) : filtered.map((client) => {
                  const mrr = getMrr(client);
                  return (
                    <tr key={client.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer">
                      <td className="p-4 font-medium">{client.name}</td>
                      <td className="p-4 text-white/50 text-xs">{(client.client_types as any)?.name || "—"}</td>
                      <td className="p-4 text-white/60">{getActivePlan(client)}</td>
                      <td className="p-4 font-mono text-white/80">
                        {mrr > 0 ? `R$ ${mrr.toLocaleString("pt-BR")}` : "—"}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[client.status] || "status-paused"}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-white/40">{client.email || client.phone || "—"}</td>
                      <td className="p-4">
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <ClientFormDialog open={showForm} onOpenChange={setShowForm} onSubmit={addClient} />
    </div>
  );
}
