import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function StatCard({ label, count, loading }: { label: string; count: number; loading: boolean }) {
  return (
    <div className="glass-card rounded-xl p-4 space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <p className="text-2xl font-heading font-bold">{count}</p>
      )}
    </div>
  );
}

export function FinancialTab() {
  const { data: categories, isLoading: loadCat } = useQuery({
    queryKey: ["fin_categories_count"],
    queryFn: async () => {
      const { count } = await supabase.from("financial_categories").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count || 0;
    },
  });

  const { data: accounts, isLoading: loadAcc } = useQuery({
    queryKey: ["bank_accounts_count"],
    queryFn: async () => {
      const { count } = await supabase.from("bank_accounts").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count || 0;
    },
  });

  const { data: expenseTypes, isLoading: loadExp } = useQuery({
    queryKey: ["expense_types_count"],
    queryFn: async () => {
      const { count } = await supabase.from("expense_types").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count || 0;
    },
  });

  const { data: costCenters, isLoading: loadCC } = useQuery({
    queryKey: ["cost_centers_count"],
    queryFn: async () => {
      const { count } = await supabase.from("cost_centers").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count || 0;
    },
  });

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-semibold text-lg">Visão Geral Financeira</h3>
      <p className="text-sm text-muted-foreground">
        Resumo dos cadastros financeiros ativos. Gerencie os itens na página de Cadastros.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Categorias" count={categories || 0} loading={loadCat} />
        <StatCard label="Contas bancárias" count={accounts || 0} loading={loadAcc} />
        <StatCard label="Tipos de despesa" count={expenseTypes || 0} loading={loadExp} />
        <StatCard label="Centros de custo" count={costCenters || 0} loading={loadCC} />
      </div>

      <div className="glass-card rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          💡 Para adicionar ou editar categorias, contas, tipos de despesa e centros de custo,
          acesse o módulo <strong>Cadastros</strong> no menu lateral.
        </p>
      </div>
    </div>
  );
}
