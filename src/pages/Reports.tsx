import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, TrendingDown, Users, FileText, DollarSign,
  Loader2, AlertTriangle, ChevronRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReports } from "@/hooks/useReports";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from "recharts";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = {
  primary: "hsl(0, 100%, 62%)",
  green: "hsl(142, 70%, 50%)",
  yellow: "hsl(45, 100%, 60%)",
  muted: "hsl(0, 0%, 40%)",
  red: "hsl(0, 80%, 55%)",
};

export default function Reports() {
  const { data, loading } = useReports();

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Análises e inteligência operacional em tempo real
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="MRR Atual"
          value={fmt(data.currentMrr)}
          icon={DollarSign}
          subtitle={`Previsão 3 meses: ${fmt(data.forecastNext3)}`}
        />
        <KpiCard
          title="Contratos Ativos"
          value={String(data.churn.activeContracts)}
          icon={FileText}
          subtitle={`${data.churn.cancelledContracts} cancelados/encerrados`}
        />
        <KpiCard
          title="Taxa de Churn"
          value={`${data.churn.churnRate}%`}
          icon={data.churn.churnRate > 10 ? AlertTriangle : TrendingDown}
          subtitle={`${data.churn.cancelledContracts} de ${data.churn.totalClientsStart + data.churn.cancelledContracts} contratos`}
          alert={data.churn.churnRate > 15}
        />
        <KpiCard
          title="Clientes c/ Entrega"
          value={String(data.fulfillmentByClient.length)}
          icon={Users}
          subtitle={
            data.fulfillmentByClient.length > 0
              ? `Média: ${Math.round(data.fulfillmentByClient.reduce((s, c) => s + c.avgFulfillment, 0) / data.fulfillmentByClient.length)}%`
              : "Sem checklists"
          }
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mrr" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="mrr">MRR & Receita</TabsTrigger>
          <TabsTrigger value="fulfillment">Cumprimento</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidade</TabsTrigger>
        </TabsList>

        {/* ── MRR & Revenue Tab ── */}
        <TabsContent value="mrr" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard title="Evolução do MRR" subtitle="Últimos 6 meses">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.mrrHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,20%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(0,10%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8 }}
                    labelStyle={{ color: "hsl(0,0%,80%)" }}
                    formatter={(v: number) => [fmt(v), "MRR"]}
                  />
                  <Line type="monotone" dataKey="mrr" stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.primary }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Receita × Despesa" subtitle="Últimos 6 meses">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,20%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(0,10%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8 }}
                    labelStyle={{ color: "hsl(0,0%,80%)" }}
                    formatter={(v: number, name: string) => [fmt(v), name === "receita" ? "Receita" : name === "despesa" ? "Despesa" : "Lucro"]}
                  />
                  <Legend formatter={(v) => v === "receita" ? "Receita" : v === "despesa" ? "Despesa" : "Lucro"} />
                  <Bar dataKey="receita" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lucro" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* MRR Table */}
          <ChartCard title="Histórico MRR Detalhado">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-3">Mês</th>
                    <th className="text-right py-2 px-3">MRR</th>
                    <th className="text-right py-2 px-3">Clientes</th>
                    <th className="text-right py-2 px-3">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mrrHistory.map((row) => (
                    <tr key={row.month} className="border-b border-border/50 hover:bg-white/[0.02]">
                      <td className="py-2 px-3 font-medium">{row.month}</td>
                      <td className="py-2 px-3 text-right">{fmt(row.mrr)}</td>
                      <td className="py-2 px-3 text-right">{row.clients}</td>
                      <td className="py-2 px-3 text-right">
                        {row.clients > 0 ? fmt(row.mrr / row.clients) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </TabsContent>

        {/* ── Fulfillment Tab ── */}
        <TabsContent value="fulfillment" className="space-y-4">
          <ChartCard title="Cumprimento Contratual por Cliente" subtitle="Baseado nos checklists de entrega">
            {data.fulfillmentByClient.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Nenhum checklist de entrega encontrado.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(280, data.fulfillmentByClient.length * 40)}>
                <BarChart data={data.fulfillmentByClient} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,20%)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="clientName" type="category" tick={{ fill: "hsl(0,0%,70%)", fontSize: 12 }} width={110} />
                  <Tooltip
                    contentStyle={{ background: "hsl(0,10%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8 }}
                    formatter={(v: number) => [`${v}%`, "Cumprimento"]}
                  />
                  <Bar dataKey="avgFulfillment" radius={[0, 4, 4, 0]}>
                    {data.fulfillmentByClient.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.avgFulfillment >= 80 ? COLORS.green : entry.avgFulfillment >= 50 ? COLORS.yellow : COLORS.red}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Fulfillment Table */}
          {data.fulfillmentByClient.length > 0 && (
            <ChartCard title="Detalhamento de Entregas">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-3">Cliente</th>
                      <th className="text-right py-2 px-3">Checklists</th>
                      <th className="text-right py-2 px-3">Cumprimento Médio</th>
                      <th className="text-right py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fulfillmentByClient.map((row) => (
                      <tr key={row.clientId} className="border-b border-border/50 hover:bg-white/[0.02]">
                        <td className="py-2 px-3 font-medium">{row.clientName}</td>
                        <td className="py-2 px-3 text-right">{row.totalChecklists}</td>
                        <td className="py-2 px-3 text-right">{row.avgFulfillment}%</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.avgFulfillment >= 80
                              ? "bg-green-500/20 text-green-400"
                              : row.avgFulfillment >= 50
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {row.avgFulfillment >= 80 ? "Bom" : row.avgFulfillment >= 50 ? "Regular" : "Crítico"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}
        </TabsContent>

        {/* ── Profitability Tab ── */}
        <TabsContent value="profitability" className="space-y-4">
          <ChartCard title="Rentabilidade por Cliente" subtitle="Receita, custo e margem">
            {data.profitability.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Nenhum lançamento financeiro vinculado a clientes.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-3">Cliente</th>
                      <th className="text-right py-2 px-3">Contrato</th>
                      <th className="text-right py-2 px-3">Receita</th>
                      <th className="text-right py-2 px-3">Custo</th>
                      <th className="text-right py-2 px-3">Lucro</th>
                      <th className="text-right py-2 px-3">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.profitability.map((row) => (
                      <tr key={row.clientId} className="border-b border-border/50 hover:bg-white/[0.02]">
                        <td className="py-2 px-3 font-medium">{row.clientName}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">{fmt(row.contractValue)}</td>
                        <td className="py-2 px-3 text-right text-green-400">{fmt(row.revenue)}</td>
                        <td className="py-2 px-3 text-right text-red-400">{fmt(row.cost)}</td>
                        <td className={`py-2 px-3 text-right font-semibold ${row.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {fmt(row.profit)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.margin >= 30
                              ? "bg-green-500/20 text-green-400"
                              : row.margin >= 10
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {row.margin}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>

          {data.profitability.length > 0 && (
            <ChartCard title="Lucro por Cliente" subtitle="Ranking de rentabilidade">
              <ResponsiveContainer width="100%" height={Math.max(280, data.profitability.length * 40)}>
                <BarChart data={data.profitability} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,20%)" />
                  <XAxis type="number" tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="clientName" type="category" tick={{ fill: "hsl(0,0%,70%)", fontSize: 12 }} width={110} />
                  <Tooltip
                    contentStyle={{ background: "hsl(0,10%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8 }}
                    formatter={(v: number) => [fmt(v), "Lucro"]}
                  />
                  <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                    {data.profitability.map((entry, i) => (
                      <Cell key={i} fill={entry.profit >= 0 ? COLORS.green : COLORS.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sub-components ──

function KpiCard({
  title, value, icon: Icon, subtitle, alert = false,
}: {
  title: string; value: string; icon: any; subtitle: string; alert?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-xl p-5 ${alert ? "border border-red-500/30" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${alert ? "bg-red-500/10" : "bg-white/[0.06]"}`}>
          <Icon className={`h-4 w-4 ${alert ? "text-red-400" : "text-primary"}`} />
        </div>
      </div>
      <p className="text-2xl font-heading font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </motion.div>
  );
}

function ChartCard({
  title, subtitle, children,
}: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5 space-y-4"
    >
      <div>
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}
