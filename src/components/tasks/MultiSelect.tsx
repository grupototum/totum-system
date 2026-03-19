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
        className="flex items-center justify-between w-full bg-white/[0.03] border border-white/10 rounded-xl h-11 px-4 text-xs text-left hover:bg-white/[0.05] focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium"
      >
        <span className={cn("truncate", isAll ? "text-white/20" : "text-white")}>{displayText}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 ml-2 text-white/20 transition-transform duration-300", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-bg-secondary border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 backdrop-blur-xl">
          <div className="max-h-60 overflow-y-auto scrollbar-thin py-1.5 px-1.5">
            {/* All option */}
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex items-center gap-2.5 w-full px-2.5 py-2.5 text-xs hover:bg-white/[0.08] transition-colors text-left rounded-lg group"
            >
              <div className={cn(
                "h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                isAll ? "bg-primary border-primary shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "border-white/10 group-hover:border-white/20"
              )}>
                {isAll && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className={cn("transition-colors", isAll ? "text-white font-bold" : "text-white/40 group-hover:text-white/60")}>{allLabel}</span>
              {totalCount !== undefined && (
                <span className="ml-auto text-[10px] text-white/20 tabular-nums font-mono">{totalCount}</span>
              )}
            </button>

            <div className="h-px bg-white/5 my-1 mx-2" />

            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2.5 text-xs hover:bg-white/[0.08] transition-colors text-left rounded-lg group"
                >
                  <div className={cn(
                    "h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                    checked ? "bg-primary border-primary shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "border-white/10 group-hover:border-white/20"
                  )}>
                    {checked && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className={cn("transition-colors flex-1 truncate", checked ? "text-white font-bold" : "text-white/40 group-hover:text-white/60")}>
                    {opt.label}
                  </span>
                  {opt.count !== undefined && (
                    <span className="ml-auto text-[10px] text-white/20 tabular-nums font-mono">{opt.count}</span>
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
