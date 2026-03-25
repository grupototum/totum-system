import { Search, X } from "lucide-react";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "./MultiSelect";
import { clientPlans, teamMembers, statusConfig, priorityConfig, typeLabels, TaskStatus, TaskPriority, TaskType, Task } from "./taskData";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  clientFilter: string[];
  onClientFilterChange: (v: string[]) => void;
  responsibleFilter: string[];
  onResponsibleFilterChange: (v: string[]) => void;
  statusFilter: string[];
  onStatusFilterChange: (v: string[]) => void;
  priorityFilter: string[];
  onPriorityFilterChange: (v: string[]) => void;
  typeFilter: string[];
  onTypeFilterChange: (v: string[]) => void;
  tasks?: Task[];
}

export function TaskFilters({
  search, onSearchChange,
  clientFilter, onClientFilterChange,
  responsibleFilter, onResponsibleFilterChange,
  statusFilter, onStatusFilterChange,
  priorityFilter, onPriorityFilterChange,
  typeFilter, onTypeFilterChange,
  tasks = [],
}: TaskFiltersProps) {
  const hasFilters = clientFilter.length > 0 || responsibleFilter.length > 0 || statusFilter.length > 0 || priorityFilter.length > 0 || typeFilter.length > 0;

  const clearAll = () => {
    onClientFilterChange([]);
    onResponsibleFilterChange([]);
    onStatusFilterChange([]);
    onPriorityFilterChange([]);
    onTypeFilterChange([]);
  };

  const counts = useMemo(() => {
    const client: Record<string, number> = {};
    const status: Record<string, number> = {};
    const priority: Record<string, number> = {};
    const type: Record<string, number> = {};
    const responsible: Record<string, number> = {};
    tasks.forEach((t) => {
      client[t.clientId] = (client[t.clientId] || 0) + 1;
      status[t.status] = (status[t.status] || 0) + 1;
      priority[t.priority] = (priority[t.priority] || 0) + 1;
      type[t.type] = (type[t.type] || 0) + 1;
      const key = t.responsible || "unassigned";
      responsible[key] = (responsible[key] || 0) + 1;
    });
    return { client, status, priority, type, responsible };
  }, [tasks]);

  const clientOptions = clientPlans.map((c) => ({ value: c.clientId, label: c.clientName, count: counts.client[c.clientId] || 0 }));
  const responsibleOptions = [
    { value: "unassigned", label: "Sem responsável", count: counts.responsible["unassigned"] || 0 },
    ...teamMembers.map((m) => ({ value: m, label: m, count: counts.responsible[m] || 0 })),
  ];
  const statusOptions = (Object.keys(statusConfig) as TaskStatus[]).map((s) => ({ value: s, label: statusConfig[s].label, count: counts.status[s] || 0 }));
  const priorityOptions = (Object.keys(priorityConfig) as TaskPriority[]).map((p) => ({ value: p, label: priorityConfig[p].label, count: counts.priority[p] || 0 }));
  const typeOptions = (Object.keys(typeLabels) as TaskType[]).map((t) => ({ value: t, label: typeLabels[t], count: counts.type[t] || 0 }));

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        {/* Busca */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">Buscar</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              placeholder="Buscar tarefas..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 bg-white/[0.05] border-border rounded-lg h-9 text-xs placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Cliente */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">Cliente</label>
          <MultiSelect options={clientOptions} selected={clientFilter} onChange={onClientFilterChange} allLabel="Todos os clientes" />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">Status</label>
          <MultiSelect options={statusOptions} selected={statusFilter} onChange={onStatusFilterChange} allLabel="Todos os status" />
        </div>

        {/* Prioridade */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">Prioridade</label>
          <MultiSelect options={priorityOptions} selected={priorityFilter} onChange={onPriorityFilterChange} allLabel="Todas" />
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">Tipo</label>
          <MultiSelect options={typeOptions} selected={typeFilter} onChange={onTypeFilterChange} allLabel="Todos os tipos" />
        </div>

        {/* Responsável */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">Responsável</label>
          <div className="flex items-center gap-2">
            <MultiSelect options={responsibleOptions} selected={responsibleFilter} onChange={onResponsibleFilterChange} allLabel="Todos" />
            {hasFilters && (
              <button onClick={clearAll} className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors p-1.5 rounded-md hover:bg-white/[0.04]" title="Limpar filtros">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
