import { useState, useMemo } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientPlans, teamMembers, statusConfig, priorityConfig, TaskStatus, TaskPriority } from "./taskData";

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

  const selectTriggerClass = "bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs focus:border-primary/50 focus:ring-primary/20 min-w-[130px]";
  const selectContentClass = "bg-[#271c1d] border-white/[0.1] text-white";
  const selectItemClass = "text-xs focus:bg-white/[0.06] focus:text-white";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
        <Input
          placeholder="Buscar tarefas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs w-48 placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20"
        />
      </div>

      <Select value={clientFilter} onValueChange={onClientFilterChange}>
        <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Cliente" /></SelectTrigger>
        <SelectContent className={selectContentClass}>
          <SelectItem value="all" className={selectItemClass}>Todos os clientes</SelectItem>
          {clientPlans.map((c) => (
            <SelectItem key={c.clientId} value={c.clientId} className={selectItemClass}>{c.clientName}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={responsibleFilter} onValueChange={onResponsibleFilterChange}>
        <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Responsável" /></SelectTrigger>
        <SelectContent className={selectContentClass}>
          <SelectItem value="all" className={selectItemClass}>Todos</SelectItem>
          <SelectItem value="unassigned" className={selectItemClass}>Sem responsável</SelectItem>
          {teamMembers.map((m) => (
            <SelectItem key={m} value={m} className={selectItemClass}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent className={selectContentClass}>
          <SelectItem value="all" className={selectItemClass}>Todos os status</SelectItem>
          {(Object.keys(statusConfig) as TaskStatus[]).map((s) => (
            <SelectItem key={s} value={s} className={selectItemClass}>{statusConfig[s].label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
        <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Prioridade" /></SelectTrigger>
        <SelectContent className={selectContentClass}>
          <SelectItem value="all" className={selectItemClass}>Todas</SelectItem>
          {(Object.keys(priorityConfig) as TaskPriority[]).map((p) => (
            <SelectItem key={p} value={p} className={selectItemClass}>{priorityConfig[p].label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button onClick={clearAll} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors px-2 py-1 rounded-md hover:bg-white/[0.04]">
          <X className="h-3 w-3" /> Limpar
        </button>
      )}
    </div>
  );
}
