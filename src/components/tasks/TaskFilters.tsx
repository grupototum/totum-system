import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientPlans, teamMembers, statusConfig, priorityConfig, typeLabels, TaskStatus, TaskPriority, TaskType } from "./taskData";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  clientFilter: string;
  onClientFilterChange: (v: string) => void;
  responsibleFilter: string;
  onResponsibleFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (v: string) => void;
}

export function TaskFilters({
  search, onSearchChange,
  clientFilter, onClientFilterChange,
  responsibleFilter, onResponsibleFilterChange,
  statusFilter, onStatusFilterChange,
  priorityFilter, onPriorityFilterChange,
}: TaskFiltersProps) {
  const hasFilters = clientFilter !== "all" || responsibleFilter !== "all" || statusFilter !== "all" || priorityFilter !== "all";

  const clearAll = () => {
    onClientFilterChange("all");
    onResponsibleFilterChange("all");
    onStatusFilterChange("all");
    onPriorityFilterChange("all");
  };

  const selectTriggerClass = "bg-white/[0.05] border-white/[0.1] rounded-lg h-9 text-xs focus:border-primary/50 focus:ring-primary/20 w-full";
  const selectContentClass = "bg-[#271c1d] border-white/[0.1] text-white";
  const selectItemClass = "text-xs focus:bg-white/[0.06] focus:text-white";

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        {/* Busca */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Buscar</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <Input
              placeholder="Buscar tarefas..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 bg-white/[0.05] border-white/[0.1] rounded-lg h-9 text-xs placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Cliente */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Cliente</label>
          <Select value={clientFilter} onValueChange={onClientFilterChange}>
            <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="all" className={selectItemClass}>Todos os clientes</SelectItem>
              {clientPlans.map((c) => (
                <SelectItem key={c.clientId} value={c.clientId} className={selectItemClass}>{c.clientName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Status</label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="all" className={selectItemClass}>Todos os status</SelectItem>
              {(Object.keys(statusConfig) as TaskStatus[]).map((s) => (
                <SelectItem key={s} value={s} className={selectItemClass}>{statusConfig[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prioridade */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Prioridade</label>
          <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
            <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="all" className={selectItemClass}>Todas</SelectItem>
              {(Object.keys(priorityConfig) as TaskPriority[]).map((p) => (
                <SelectItem key={p} value={p} className={selectItemClass}>{priorityConfig[p].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Responsável */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Responsável</label>
          <div className="flex items-center gap-2">
            <Select value={responsibleFilter} onValueChange={onResponsibleFilterChange}>
              <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value="all" className={selectItemClass}>Todos</SelectItem>
                <SelectItem value="unassigned" className={selectItemClass}>Sem responsável</SelectItem>
                {teamMembers.map((m) => (
                  <SelectItem key={m} value={m} className={selectItemClass}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <button onClick={clearAll} className="shrink-0 flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors p-1.5 rounded-md hover:bg-white/[0.04]" title="Limpar filtros">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
