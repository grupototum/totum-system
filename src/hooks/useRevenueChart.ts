import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MonthData {
  month: string;
  receita: number;
  custo: number;
}

export function useRevenueChart() {
  const [data, setData] = useState<MonthData[]>([]);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const results: MonthData[] = [];

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
    }
    load();
  }, []);

  return { data };
}