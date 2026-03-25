import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DollarSign, Users, Grid3X3, Database,
  ChevronRight, Loader2,
} from "lucide-react";
import { RegistryTable, RegistryItem } from "@/components/registries/RegistryTable";
import { RegistryFormDialog, FormField } from "@/components/registries/RegistryFormDialog";
import { registryGroups, RegistryConfig } from "@/components/registries/registryData";
import { useRegistryData, registryTableMap } from "@/hooks/useRegistryData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const groupIcons: Record<string, typeof DollarSign> = {
  DollarSign, Users, Grid3X3, Database,
};

export default function Registries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGroupKey = searchParams.get("grupo") || registryGroups[0].key;
  const activeRegistryKey = searchParams.get("cadastro") || null;

  const activeGroup = registryGroups.find((g) => g.key === activeGroupKey) || registryGroups[0];
  const activeRegistry = activeRegistryKey
    ? activeGroup.registries.find((r) => r.key === activeRegistryKey) || activeGroup.registries[0]
    : activeGroup.registries[0];

  // Use Supabase data if table mapping exists, otherwise fallback to mock
  const { data: supabaseData, loading, hasTable, addItem, updateItem, deleteItem, toggleStatus } = useRegistryData(activeRegistry.key);

  // Load dynamic options for fields with sourceTable
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, { label: string; value: string }[]>>({});
  const [fkNames, setFkNames] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    const sourceTables = activeRegistry.formFields
      .filter((f) => f.sourceTable)
      .map((f) => ({ key: f.key, table: f.sourceTable! }));

    if (sourceTables.length === 0) return;

    const loadOptions = async () => {
      const opts: Record<string, { label: string; value: string }[]> = {};
      const names: Record<string, Record<string, string>> = {};
      await Promise.all(
        sourceTables.map(async ({ key, table }) => {
          const { data } = await supabase.from(table as any).select("id, name").eq("is_active", true).order("name");
          if (data) {
            opts[key] = data.map((r: any) => ({ label: r.name, value: r.id }));
            names[key] = {};
            data.forEach((r: any) => { names[key][r.id] = r.name; });
          }
        })
      );
      setDynamicOptions(opts);
      setFkNames(names);
    };
    loadOptions();
  }, [activeRegistry.key]);

  // Enrich data with resolved FK names
  const enrichedData = hasTable
    ? supabaseData.map((row) => {
        const enriched = { ...row };
        activeRegistry.formFields.forEach((f) => {
          if (f.sourceTable && fkNames[f.key] && row[f.key]) {
            enriched[`${f.key}_nome`] = fkNames[f.key][row[f.key]] || "";
          }
        });
        return enriched;
      })
    : undefined;

  // Merge dynamic options into form fields
  const resolvedFields: FormField[] = activeRegistry.formFields.map((f) => {
    if (f.sourceTable && dynamicOptions[f.key]) {
      return { ...f, options: dynamicOptions[f.key] };
    }
    return f;
  });

  // Fallback local state for registries without DB tables
  const [localStore, setLocalStore] = useState<Record<string, RegistryItem[]>>(() => {
    const store: Record<string, RegistryItem[]> = {};
    registryGroups.forEach((g) =>
      g.registries.forEach((r) => {
        if (!registryTableMap[r.key]) {
          store[r.key] = [...r.initialData];
        }
      })
    );
    return store;
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<RegistryItem | null>(null);

  const currentData = hasTable ? (enrichedData || supabaseData) : (localStore[activeRegistry.key] || []);

  const setGroup = (groupKey: string) => {
    const group = registryGroups.find((g) => g.key === groupKey)!;
    setSearchParams({ grupo: groupKey, cadastro: group.registries[0].key });
  };

  const setRegistry = (registryKey: string) => {
    setSearchParams({ grupo: activeGroupKey, cadastro: registryKey });
  };

  const handleAdd = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: RegistryItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (item: RegistryItem) => {
    if (hasTable) {
      await deleteItem(item.id, item.name);
    } else {
      setLocalStore((prev) => ({
        ...prev,
        [activeRegistry.key]: prev[activeRegistry.key].filter((i) => i.id !== item.id),
      }));
      toast({ title: "Registro excluído", description: `"${item.name}" foi removido.` });
    }
  };

  const handleToggleStatus = async (item: RegistryItem) => {
    if (hasTable) {
      await toggleStatus(item.id, item.status || "ativo", item.name);
    } else {
      setLocalStore((prev) => ({
        ...prev,
        [activeRegistry.key]: prev[activeRegistry.key].map((i) =>
          i.id === item.id ? { ...i, status: i.status === "ativo" ? "inativo" : "ativo" } : i
        ),
      }));
      toast({
        title: item.status === "ativo" ? "Desativado" : "Ativado",
        description: `"${item.name}" foi ${item.status === "ativo" ? "desativado" : "ativado"}.`,
      });
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    if (hasTable) {
      if (editItem) {
        const ok = await updateItem(editItem.id, values);
        if (ok) setDialogOpen(false);
      } else {
        const ok = await addItem(values);
        if (ok) setDialogOpen(false);
      }
    } else {
      const key = activeRegistry.key;
      if (editItem) {
        setLocalStore((prev) => ({
          ...prev,
          [key]: prev[key].map((i) => (i.id === editItem.id ? { ...i, ...values } : i)),
        }));
        toast({ title: "Registro atualizado", description: `"${values.name}" salvo com sucesso.` });
      } else {
        const exists = (localStore[key] || []).some(
          (i) => i.name.toLowerCase() === (values.name || "").toLowerCase()
        );
        if (exists) {
          toast({ title: "Duplicidade detectada", description: `Já existe um registro com o nome "${values.name}".`, variant: "destructive" });
          return;
        }
        const newItem: RegistryItem = {
          id: crypto.randomUUID(),
          name: values.name || "",
          status: "ativo" as const,
          ...values,
        };
        setLocalStore((prev) => ({
          ...prev,
          [key]: [...(prev[key] || []), newItem],
        }));
        toast({ title: "Registro criado", description: `"${values.name}" adicionado com sucesso.` });
      }
      setDialogOpen(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left Sub-Navigation */}
      <aside className="w-64 shrink-0 border-r border-border overflow-y-auto scrollbar-thin bg-white/[0.01]">
        <div className="p-5">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-1">Cadastros & Config</h2>
          <p className="text-[10px] text-muted-foreground/50">Base estrutural do ERP</p>
        </div>

        <nav className="px-2 pb-4">
          {registryGroups.map((group) => {
            const Icon = groupIcons[group.icon] || Database;
            const isGroupActive = group.key === activeGroupKey;

            return (
              <div key={group.key} className="mb-1">
                <button
                  onClick={() => setGroup(group.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isGroupActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground/70"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{group.label}</span>
                  <ChevronRight className={`h-3 w-3 transition-transform ${isGroupActive ? "rotate-90" : ""}`} />
                </button>

                {isGroupActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden ml-4 mt-0.5"
                  >
                    {group.registries.map((reg) => (
                      <button
                        key={reg.key}
                        onClick={() => setRegistry(reg.key)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                          activeRegistry.key === reg.key
                            ? "text-primary font-medium bg-primary/[0.08]"
                            : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-white/[0.03]"
                        }`}
                      >
                        {reg.label}
                        {!registryTableMap[reg.key] && <span className="text-[9px] text-muted-foreground/40 ml-1">(local)</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-8">
        {loading && hasTable ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <RegistryTable
            title={activeRegistry.label}
            description={activeRegistry.description}
            columns={activeRegistry.columns}
            data={currentData}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>

      {/* Form Dialog */}
      <RegistryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editItem ? `Editar ${activeRegistry.label}` : `Novo ${activeRegistry.label}`}
        fields={resolvedFields}
        initialValues={editItem || undefined}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
