import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/useAdminSettings";

const CURRENCIES = ["BRL", "USD", "EUR"];
const DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"];
const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Fortaleza",
  "America/Manaus",
  "America/Rio_Branco",
  "America/Belem",
  "UTC",
];
const TASK_STATUSES = ["pendente", "em_andamento"];
const TASK_PRIORITIES = ["baixa", "media", "alta", "urgente"];

export function SystemTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateMutation = useUpdateSystemSettings();

  const [currency, setCurrency] = useState("BRL");
  const [dateFormat, setDateFormat] = useState("dd/MM/yyyy");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [defaultStatus, setDefaultStatus] = useState("pendente");
  const [defaultPriority, setDefaultPriority] = useState("media");
  const [archiveDays, setArchiveDays] = useState(30);

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency || "BRL");
      setDateFormat(settings.date_format || "dd/MM/yyyy");
      setTimezone(settings.timezone || "America/Sao_Paulo");
      setDefaultStatus(settings.default_task_status || "pendente");
      setDefaultPriority(settings.default_task_priority || "media");
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando configurações...</span>
      </div>
    );
  }

  const handleSave = () => {
    updateMutation.mutate({
      currency,
      date_format: dateFormat,
      timezone,
      default_task_status: defaultStatus,
      default_task_priority: defaultPriority,
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-semibold text-lg">Configurações do Sistema</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Moeda padrão</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Formato de data</Label>
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fuso horário</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz.replace("America/", "").replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status padrão de tarefas</Label>
          <Select value={defaultStatus} onValueChange={setDefaultStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade padrão de tarefas</Label>
          <Select value={defaultPriority} onValueChange={setDefaultPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
