import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  name: string;
  plan: string;
  mrr: number;
  status: "ativo" | "pausado" | "cancelado";
  fulfillment: number;
  dueInvoices: number;
}

const mockClients: Client[] = [
  { id: "1", name: "TechVentures S.A.", plan: "Premium", mrr: 12500, status: "ativo", fulfillment: 42, dueInvoices: 2 },
  { id: "2", name: "Nova Digital", plan: "Essencial", mrr: 4800, status: "ativo", fulfillment: 65, dueInvoices: 0 },
  { id: "3", name: "Startup Labs", plan: "Premium", mrr: 9200, status: "ativo", fulfillment: 78, dueInvoices: 1 },
  { id: "4", name: "Innova Corp", plan: "Pro", mrr: 7600, status: "ativo", fulfillment: 91, dueInvoices: 0 },
  { id: "5", name: "DigitalPlus", plan: "Essencial", mrr: 3400, status: "ativo", fulfillment: 95, dueInvoices: 0 },
  { id: "6", name: "Agro Connect", plan: "Pro", mrr: 6800, status: "ativo", fulfillment: 100, dueInvoices: 0 },
  { id: "7", name: "MegaStore", plan: "Premium", mrr: 15000, status: "pausado", fulfillment: 0, dueInvoices: 3 },
  { id: "8", name: "HealthTech", plan: "Essencial", mrr: 0, status: "cancelado", fulfillment: 0, dueInvoices: 0 },
];

const statusConfig = {
  ativo: "status-active",
  pausado: "status-paused",
  cancelado: "status-cancelled",
};

export default function Clients() {
  const [search, setSearch] = useState("");

  const filtered = mockClients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-white/50 mt-1">{mockClients.filter(c => c.status === "ativo").length} ativos · {mockClients.length} total</p>
        </div>
        <Button className="gradient-primary border-0 text-white font-semibold gap-2 rounded-full px-5">
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
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Plano</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                  <span className="flex items-center gap-1 cursor-pointer hover:text-white/60">MRR <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Cumprimento</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Faturas</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <td className="p-4 font-medium">{client.name}</td>
                  <td className="p-4 text-white/60">{client.plan}</td>
                  <td className="p-4 font-mono text-white/80">
                    {client.mrr > 0 ? `R$ ${client.mrr.toLocaleString("pt-BR")}` : "—"}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[client.status]}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {client.status === "ativo" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              client.fulfillment >= 90 ? "bg-emerald-500" :
                              client.fulfillment >= 70 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${client.fulfillment}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-white/50">{client.fulfillment}%</span>
                      </div>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    {client.dueInvoices > 0 ? (
                      <span className="text-red-400 text-xs font-medium">{client.dueInvoices} vencida(s)</span>
                    ) : (
                      <span className="text-white/30 text-xs">Em dia</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
