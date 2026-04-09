import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allLabel?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = "Todos", allLabel = "Todos" }: MultiSelectProps) {
  const totalCount = options.some(o => o.count !== undefined) ? options.reduce((sum, o) => sum + (o.count || 0), 0) : undefined;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAll = selected.length === 0;

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const displayText = isAll
    ? allLabel
    : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || selected[0]
      : `${selected.length} selecionados`;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-white/[0.05] border border-border rounded-lg h-9 px-3 text-xs text-left focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
      >
        <span className={cn("truncate", isAll ? "text-muted-foreground" : "text-foreground")}>{displayText}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 ml-2 text-muted-foreground/50 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="max-h-48 overflow-y-auto scrollbar-thin py-1">
            {/* All option */}
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-white/[0.06] transition-colors text-left"
            >
              <div className={cn(
                "h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0",
                isAll ? "bg-primary border-primary" : "border-white/20"
              )}>
                {isAll && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className={isAll ? "text-white font-medium" : "text-muted-foreground"}>{allLabel}</span>
              {totalCount !== undefined && (
                <span className="ml-auto text-[10px] text-muted-foreground/50 tabular-nums">{totalCount}</span>
              )}
            </button>

            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-white/[0.06] transition-colors text-left"
                >
                  <div className={cn(
                    "h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0",
                    checked ? "bg-primary border-primary" : "border-white/20"
                  )}>
                    {checked && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span className={checked ? "text-white font-medium" : "text-muted-foreground"}>{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="ml-auto text-[10px] text-muted-foreground/50 tabular-nums">{opt.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
