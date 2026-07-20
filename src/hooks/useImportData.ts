import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { attachOrganizationId } from "@/lib/tenant";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { listAllClientsRaw, createClientReturningId } from "@/data/clients.repo";
import { listFinancialCategoriesForMatching, listBankAccountsForMatching, createFinancialEntries } from "@/data/financial.repo";
import { createImportBatch, updateImportBatchCounts, getLastCompletedImportBatch, rollbackImportBatch } from "@/data/import-batches.repo";

export interface SystemField {
  key: string;
  label: string;
  required: boolean;
}

export const SYSTEM_FIELDS: SystemField[] = [
  { key: "date", label: "Data", required: true },
  { key: "description", label: "Descrição", required: true },
  { key: "value", label: "Valor", required: true },
  { key: "type", label: "Tipo (Receita/Despesa)", required: true },
  { key: "category", label: "Categoria", required: false },
  { key: "bank_account", label: "Conta Bancária", required: false },
  { key: "client_name", label: "Nome do Cliente", required: false },
  { key: "client_email", label: "E-mail do Cliente", required: false },
  { key: "client_phone", label: "Telefone do Cliente", required: false },
  { key: "document", label: "Documento (CPF/CNPJ)", required: false },
  { key: "notes", label: "Observações", required: false },
  { key: "status", label: "Status", required: false },
  { key: "tags", label: "Tags", required: false },
];

const ALIASES: Record<string, string[]> = {
  date: ["data", "date", "dt", "vencimento", "data_vencimento"],
  description: ["descrição", "descricao", "description", "desc", "historico", "histórico"],
  value: ["valor", "value", "amount", "montante", "total"],
  type: ["tipo", "type", "natureza"],
  category: ["categoria", "category", "cat"],
  bank_account: ["conta", "bank", "banco", "conta_bancaria", "conta bancária"],
  client_name: ["cliente", "client", "nome_cliente", "nome do cliente", "nome"],
  client_email: ["email", "e-mail", "email_cliente"],
  client_phone: ["telefone", "phone", "tel", "fone", "celular"],
  document: ["documento", "document", "cpf", "cnpj", "cpf_cnpj"],
  notes: ["observações", "observacoes", "notes", "obs", "notas"],
  status: ["status", "situação", "situacao"],
  tags: ["tags", "etiquetas", "marcadores"],
};

export interface ValidatedRow {
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

export interface ImportBatch {
  id: string;
  total_records: number;
  financial_count: number;
  client_count: number;
  status: string;
  created_at: string;
}

export function parseValue(raw: string): number | null {
  if (!raw) return null;
  let cleaned = raw.replace(/[R$\s]/g, "").trim();
  if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(,\d{3})*\.\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (/^\d+,\d+$/.test(cleaned)) {
    cleaned = cleaned.replace(",", ".");
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return null;
}

const INCOME_KEYWORDS = ["receita", "income", "entrada", "receber", "crédito", "credito"];
const EXPENSE_KEYWORDS = ["despesa", "expense", "saída", "saida", "pagar", "débito", "debito"];

export function useImportData() {
  const { tenant } = useTenant();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const autoMap = useCallback((cols: string[]) => {
    const newMapping: Record<string, string> = {};
    for (const col of cols) {
      const normalized = col.toLowerCase().trim().replace(/[_\-\s]+/g, " ");
      for (const [fieldKey, aliases] of Object.entries(ALIASES)) {
        if (aliases.some(a => normalized === a || normalized.includes(a))) {
          if (!Object.values(newMapping).includes(fieldKey)) {
            newMapping[col] = fieldKey;
            break;
          }
        }
      }
    }
    setMapping(newMapping);
  }, []);

  const parseFile = useCallback(async (f: File) => {
    setFile(f);
    const ext = f.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      return new Promise<void>((resolve) => {
        Papa.parse(f, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const data = result.data as Record<string, string>[];
            const cols = result.meta.fields || [];
            setRawData(data);
            setDetectedColumns(cols);
            autoMap(cols);
            resolve();
          },
        });
      });
    } else {
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
      const cols = data.length > 0 ? Object.keys(data[0]) : [];
      setRawData(data.map(row => {
        const cleaned: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) cleaned[k] = String(v ?? "");
        return cleaned;
      }));
      setDetectedColumns(cols);
      autoMap(cols);
    }
  }, [autoMap]);

  const updateMapping = useCallback((col: string, fieldKey: string) => {
    setMapping(prev => {
      const next = { ...prev };
      if (fieldKey !== "__ignore__") {
        for (const [k, v] of Object.entries(next)) {
          if (v === fieldKey) delete next[k];
        }
      }
      if (fieldKey === "__ignore__") delete next[col];
      else next[col] = fieldKey;
      return next;
    });
  }, []);

  const validate = useCallback(() => {
    const reverseMap: Record<string, string> = {};
    for (const [col, field] of Object.entries(mapping)) reverseMap[field] = col;

    const rows: ValidatedRow[] = rawData.map(row => {
      const errors: string[] = [];
      const mapped: Record<string, string> = {};
      for (const [field, col] of Object.entries(reverseMap)) mapped[field] = (row[col] ?? "").trim();

      if (!mapped.date) errors.push("Data ausente");
      else if (!parseDate(mapped.date)) errors.push("Data inválida");
      if (!mapped.description) errors.push("Descrição ausente");
      if (!mapped.value) errors.push("Valor ausente");
      else if (parseValue(mapped.value) === null) errors.push("Valor inválido");
      if (!mapped.type) errors.push("Tipo ausente");
      else {
        const t = mapped.type.toLowerCase();
        if (![...INCOME_KEYWORDS, ...EXPENSE_KEYWORDS].includes(t)) {
          errors.push("Tipo deve ser Receita ou Despesa");
        }
      }
      return { data: mapped, errors, isValid: errors.length === 0 };
    });

    setValidatedRows(rows);
    return rows;
  }, [rawData, mapping]);

  const executeImport = useCallback(async () => {
    const validRows = validatedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    setProgress(0);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const batch = await createImportBatch(user.id, validRows.length);

      // Collect unique clients
      const clientMap = new Map<string, { name: string; email?: string; phone?: string; document?: string }>();
      for (const row of validRows) {
        const name = row.data.client_name;
        if (name && !clientMap.has(name.toLowerCase())) {
          clientMap.set(name.toLowerCase(), {
            name,
            email: row.data.client_email || undefined,
            phone: row.data.client_phone || undefined,
            document: row.data.document || undefined,
          });
        }
      }

      // Find or create clients
      const clientIdMap = new Map<string, string>();
      let clientCount = 0;

      if (clientMap.size > 0) {
        const existing = await listAllClientsRaw();
        const existingMap = new Map((existing || []).map((c: any) => [String(c.company_name || c.name || "").toLowerCase(), c.id]));
        for (const [key, client] of clientMap) {
          if (existingMap.has(key)) {
            clientIdMap.set(key, existingMap.get(key)!);
          } else {
            try {
              const createdId = await createClientReturningId({
                company_name: client.name,
                contact_name: client.name,
                email: client.email || null,
                phone: client.phone || null,
                cnpj: client.document || null,
                import_batch_id: batch.id,
                status: "active",
              } as any, tenant?.organization_id);
              clientIdMap.set(key, createdId);
              clientCount++;
            } catch {
              // segue sem esse cliente — mesmo comportamento original (erro silencioso)
            }
          }
        }
      }

      // Fetch categories and bank accounts for matching
      const categories = await listFinancialCategoriesForMatching();
      const bankAccounts = await listBankAccountsForMatching();
      const catMap = new Map((categories || []).map(c => [c.name.toLowerCase(), c.id]));
      const bankMap = new Map((bankAccounts || []).map(b => [b.name.toLowerCase(), b.id]));

      // Insert financial entries in batches
      const CHUNK_SIZE = 50;
      let financialCount = 0;

      for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
        const chunk = validRows.slice(i, i + CHUNK_SIZE);
        const entries = chunk.map(row => {
          const typeRaw = row.data.type.toLowerCase();
          const isIncome = INCOME_KEYWORDS.includes(typeRaw);
          const entryClass = isIncome ? "receita" : typeRaw.includes("custo") ? "custo" : "despesa";
          const value = Math.abs(parseValue(row.data.value) || 0);
          const clientKey = row.data.client_name?.toLowerCase();
          return attachOrganizationId({
            description: row.data.description,
            value,
            type: isIncome ? "receber" : "pagar",
            entry_class: entryClass,
            nature: "variavel",
            due_date: parseDate(row.data.date),
            status: "pendente",
            notes: row.data.notes || null,
            client_id: clientKey ? clientIdMap.get(clientKey) || null : null,
            category_id: row.data.category ? catMap.get(row.data.category.toLowerCase()) || null : null,
            bank_account_id: row.data.bank_account ? bankMap.get(row.data.bank_account.toLowerCase()) || null : null,
            import_batch_id: batch.id,
            created_by: user.id,
          }, tenant?.organization_id);
        });

        try {
          await createFinancialEntries(entries as any);
          financialCount += entries.length;
        } catch (error) {
          console.error("Insert error:", error);
        }
        setProgress(Math.round(((i + chunk.length) / validRows.length) * 100));
      }

      await updateImportBatchCounts(batch.id, financialCount, clientCount);

      toast({ title: "✅ Importação concluída", description: `${financialCount} lançamentos e ${clientCount} novos clientes importados.` });

      setStep(1);
      setFile(null);
      setRawData([]);
      setDetectedColumns([]);
      setMapping({});
      setValidatedRows([]);
    } catch (err) {
      console.error("Import error:", err);
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Erro na importação", description: message, variant: "destructive" });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  }, [tenant?.organization_id, validatedRows]);

  const rollbackLastImport = useCallback(async () => {
    try {
      const batch = await getLastCompletedImportBatch();

      if (!batch) {
        toast({ title: "Nenhuma importação para desfazer", variant: "destructive" });
        return;
      }

      await rollbackImportBatch(batch.id);

      toast({ title: "Importação revertida", description: `${batch.total_records} registros removidos.` });
    } catch (err) {
      console.error("Rollback error:", err);
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Erro ao reverter", description: message, variant: "destructive" });
    }
  }, []);

  const downloadTemplate = useCallback(() => {
    const headers = ["Data", "Descrição", "Valor", "Tipo", "Categoria", "Conta Bancária", "Nome do Cliente", "E-mail do Cliente", "Telefone do Cliente", "Documento", "Observações", "Status", "Tags"];
    const example1 = ["01/01/2026", "Serviço de Marketing Digital", "5000.00", "Receita", "Marketing", "Banco do Brasil", "Empresa ABC", "contato@empresa.com", "(11) 99999-9999", "12.345.678/0001-90", "Contrato mensal", "Pendente", "importado"];
    const example2 = ["05/01/2026", "Aluguel do escritório", "3500.00", "Despesa", "Infraestrutura", "Itaú", "", "", "", "", "Pagamento mensal", "Pago", ""];
    const csv = [headers, example1, example2].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_importacao.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const stats = {
    total: validatedRows.length,
    valid: validatedRows.filter(r => r.isValid).length,
    invalid: validatedRows.filter(r => !r.isValid).length,
    totalIncome: validatedRows.filter(r => r.isValid && INCOME_KEYWORDS.includes((r.data.type || "").toLowerCase()))
      .reduce((sum, r) => sum + (parseValue(r.data.value) || 0), 0),
    totalExpense: validatedRows.filter(r => r.isValid && EXPENSE_KEYWORDS.includes((r.data.type || "").toLowerCase()))
      .reduce((sum, r) => sum + (parseValue(r.data.value) || 0), 0),
  };

  return {
    step, setStep, file, parseFile, rawData, detectedColumns,
    mapping, updateMapping, validatedRows, validate,
    importing, progress, executeImport, rollbackLastImport,
    downloadTemplate, stats,
  };
}
