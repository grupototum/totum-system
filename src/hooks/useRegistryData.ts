import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Maps frontend registry keys to Supabase table names and column mappings
// Frontend field key → DB column name
export interface RegistryTableConfig {
  table: string;
  columns: Record<string, string>; // frontendKey → dbColumn
  statusField?: string; // default "is_active"
}

// Registry key → table config
export const registryTableMap: Record<string, RegistryTableConfig> = {
  bancos: { table: "banks", columns: { name: "name", codigo: "code" } },
  contas_bancarias: { table: "bank_accounts", columns: { name: "name", agencia: "agency", conta: "account_number", tipo_conta: "account_type" } },
  centros_custo: { table: "cost_centers", columns: { name: "name", descricao: "description" } },
  categorias_financeiras: { table: "financial_categories", columns: { name: "name", tipo: "type" } },
  tipos_despesa: { table: "expense_types", columns: { name: "name", recorrencia: "recurrence", descricao: "description" } },
  tipos_cliente: { table: "client_types", columns: { name: "name", descricao: "description" } },
  tipos_contrato: { table: "contract_types", columns: { name: "name", descricao: "description" } },
  planos_recorrentes: { table: "plans", columns: { name: "name", valor: "value", entregas: "description" } },
  tipos_projeto: { table: "project_types", columns: { name: "name", descricao: "description", tipo_servico: "service_type_id", tipo_receita: "revenue_type_id" } },
  tipos_receita: { table: "revenue_types", columns: { name: "name", descricao: "description" } },
  tipos_servico: { table: "service_types", columns: { name: "name", descricao: "description" } },
  tipos_produto: { table: "product_types", columns: { name: "name", descricao: "description" } },
  categorias_gerais: { table: "general_categories", columns: { name: "name", modulo: "module", cor: "color", descricao: "description" } },
  fornecedores: { table: "suppliers", columns: { name: "name", servico: "document", contato: "email" } },
  parceiros: { table: "partners", columns: { name: "name", tipo: "description" } },
  departamentos: { table: "departments", columns: { name: "name" } },
  tags: { table: "tags", columns: { name: "name", cor: "color" } },
  motivos_cancelamento: { table: "cancellation_reasons", columns: { name: "name", descricao: "description" } },
  motivos_inadimplencia: { table: "delinquency_reasons", columns: { name: "name", descricao: "description" } },
  motivos_nao_entrega: { table: "delay_reasons", columns: { name: "name", descricao: "description" } },
};

// Valid table names for type safety
type ValidTable = 
  | "banks" | "bank_accounts" | "cost_centers" | "financial_categories"
  | "expense_types" | "client_types" | "contract_types" | "plans"
  | "project_types" | "service_types" | "product_types" | "general_categories"
  | "suppliers" | "partners" | "departments" | "tags"
  | "cancellation_reasons" | "delinquency_reasons" | "delay_reasons"
  | "revenue_types";

export interface RegistryRow {
  id: string;
  name: string;
  status: "ativo" | "inativo";
  [key: string]: any;
}

function dbToFrontend(dbRow: any, config: RegistryTableConfig): RegistryRow {
  const result: RegistryRow = {
    id: dbRow.id,
    name: dbRow.name || "",
    status: dbRow.is_active !== false ? "ativo" : "inativo",
  };
  
  for (const [frontKey, dbKey] of Object.entries(config.columns)) {
    if (frontKey === "name") continue;
    result[frontKey] = dbRow[dbKey] ?? "";
  }
  
  return result;
}

function frontendToDb(frontRow: Record<string, any>, config: RegistryTableConfig): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [frontKey, dbKey] of Object.entries(config.columns)) {
    if (frontRow[frontKey] !== undefined) {
      result[dbKey] = frontRow[frontKey];
    }
  }
  
  if (frontRow.status !== undefined) {
    result.is_active = frontRow.status === "ativo";
  }
  
  return result;
}

export function useRegistryData(registryKey: string) {
  const [data, setData] = useState<RegistryRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const config = registryTableMap[registryKey];
  const hasTable = !!config;
  
  const fetchData = useCallback(async () => {
    if (!config) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data: rows, error } = await supabase
      .from(config.table as ValidTable)
      .select("*")
      .order("name");
      
    if (error) {
      console.error(`Error fetching ${config.table}:`, error);
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } else {
      setData((rows || []).map((r: any) => dbToFrontend(r, config)));
    }
    setLoading(false);
  }, [config]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const addItem = async (values: Record<string, any>): Promise<boolean> => {
    if (!config) return false;
    
    const dbValues = frontendToDb(values, config);
    dbValues.is_active = true;
    
    // For financial_categories, type is required
    if (config.table === "financial_categories" && !dbValues.type) {
      dbValues.type = "despesa";
    }
    // For general_categories, module is required
    if (config.table === "general_categories" && !dbValues.module) {
      dbValues.module = "geral";
    }
    
    const { error } = await supabase
      .from(config.table as ValidTable)
      .insert(dbValues as any);
      
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Duplicidade detectada", description: `Já existe um registro com esse nome.`, variant: "destructive" });
      } else {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      }
      return false;
    }
    
    await fetchData();
    toast({ title: "Registro criado", description: `"${values.name}" adicionado com sucesso.` });
    return true;
  };
  
  const updateItem = async (id: string, values: Record<string, any>): Promise<boolean> => {
    if (!config) return false;
    
    const dbValues = frontendToDb(values, config);
    
    const { error } = await supabase
      .from(config.table as ValidTable)
      .update(dbValues)
      .eq("id", id);
      
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return false;
    }
    
    await fetchData();
    toast({ title: "Registro atualizado", description: `"${values.name}" salvo com sucesso.` });
    return true;
  };
  
  const deleteItem = async (id: string, name: string): Promise<boolean> => {
    if (!config) return false;
    
    const { error } = await supabase
      .from(config.table as ValidTable)
      .delete()
      .eq("id", id);
      
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return false;
    }
    
    await fetchData();
    toast({ title: "Registro excluído", description: `"${name}" foi removido.` });
    return true;
  };
  
  const toggleStatus = async (id: string, currentStatus: string, name: string): Promise<boolean> => {
    if (!config) return false;
    
    const newActive = currentStatus !== "ativo";
    
    const { error } = await supabase
      .from(config.table as ValidTable)
      .update({ is_active: newActive } as any)
      .eq("id", id);
      
    if (error) {
      toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" });
      return false;
    }
    
    await fetchData();
    toast({
      title: newActive ? "Ativado" : "Desativado",
      description: `"${name}" foi ${newActive ? "ativado" : "desativado"}.`,
    });
    return true;
  };
  
  return { data, loading, hasTable, addItem, updateItem, deleteItem, toggleStatus, refetch: fetchData };
}
