import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { demoFinancialEntries } from "@/data/demoData";

export interface RevenueChartMonth {
  month: string;
  receita: number;
  custo: number;
}

export function useRevenueChartData() {
  const { isDemoMode } = useDemo();
  const [data, setData] = useState<RevenueChartMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const now = new Date();
      const results: RevenueChartMonth[] = [];

      if (isDemoMode) {
        for (let i = 8; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const monthEntries = (demoFinancialEntries as any[]).filter((e) => e.due_date?.startsWith(monthStr));
          const receita = monthEntries.filter((e) => e.type === "receber").reduce((s, e) => s + Number(e.value), 0);
          const custo = monthEntries.filter((e) => e.type === "pagar").reduce((s, e) => s + Number(e.value), 0);
          const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
          results.push({ month: label.charAt(0).toUpperCase() + label.slice(1), receita, custo });
        }
        setData(results);
        setLoading(false);
        return;
      }

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

        const receita = (entries || []).filter((e: any) => e.type === "receber").reduce((s, e: any) => s + Number(e.value), 0);
        const custo = (entries || []).filter((e: any) => e.type === "pagar").reduce((s, e: any) => s + Number(e.value), 0);
        const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        results.push({ month: label.charAt(0).toUpperCase() + label.slice(1), receita, custo });
      }
      setData(results);
      setLoading(false);
    };
    load();
  }, [isDemoMode]);

  return { data, loading };
}
