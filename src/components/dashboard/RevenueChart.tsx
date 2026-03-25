import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-lg p-3 text-xs">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name === "receita" ? "Receita" : "Custo"}:</span>
          <span className="font-heading font-medium">
            R$ {(entry.value / 1000).toFixed(0)}k
          </span>
        </p>
      ))}
    </div>
  );
};

export function RevenueChart() {
  const [data, setData] = useState<{ month: string; receita: number; custo: number }[]>([]);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const results: { month: string; receita: number; custo: number }[] = [];

      for (let i = 8; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const monthEnd = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

        const { data: entries } = await supabase
          .from("financial_entries")
          .select("type, value")
          .gte("due_date", monthStart)
          .lt("due_date", monthEnd);

        const receita = (entries || []).filter(e => e.type === "receber").reduce((s, e) => s + Number(e.value), 0);
        const custo = (entries || []).filter(e => e.type === "pagar").reduce((s, e) => s + Number(e.value), 0);
        const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        results.push({ month: label.charAt(0).toUpperCase() + label.slice(1), receita, custo });
      }
      setData(results);
    }
    load();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading text-base font-semibold">Receita vs Custo Operacional</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Últimos 9 meses</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" /> Receita
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Custo
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(1, 97%, 58%)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(1, 97%, 58%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.08} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="receita" stroke="hsl(1, 97%, 58%)" strokeWidth={2} fill="url(#revGrad)" />
          <Area type="monotone" dataKey="custo" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} fill="url(#costGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
