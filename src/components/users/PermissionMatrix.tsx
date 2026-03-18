import { useState, useMemo } from "react";
import { ChevronRight, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  permissionTree, PermCategory, PermAction, PermissionsMap,
  actionLabels, permKey,
} from "./permissionsData";
import { cn } from "@/lib/utils";

interface PermissionMatrixProps {
  permissions: PermissionsMap;
  onChange: (permissions: PermissionsMap) => void;
  readOnly?: boolean;
}

export function PermissionMatrix({ permissions, onChange, readOnly }: PermissionMatrixProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(permissionTree.map((c) => c.key)));
  const collapseAll = () => setExpanded(new Set());

  const filteredTree = useMemo(() => {
    if (!search.trim()) return permissionTree;
    const q = search.toLowerCase();
    return permissionTree
      .map((cat) => ({
        ...cat,
        subcategories: cat.subcategories.filter(
          (sub) => sub.label.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.subcategories.length > 0);
  }, [search]);

  const handleCheck = (subKey: string, action: PermAction, checked: boolean) => {
    onChange({ ...permissions, [permKey(subKey, action)]: checked });
  };

  const toggleCategoryAll = (cat: PermCategory, checked: boolean) => {
    const next = { ...permissions };
    cat.subcategories.forEach((sub) =>
      sub.actions.forEach((act) => { next[permKey(sub.key, act)] = checked; })
    );
    onChange(next);
  };

  const categoryCheckedCount = (cat: PermCategory) => {
    let total = 0, checked = 0;
    cat.subcategories.forEach((sub) =>
      sub.actions.forEach((act) => { total++; if (permissions[permKey(sub.key, act)]) checked++; })
    );
    return { total, checked };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <Input
            placeholder="Buscar permissão..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs placeholder:text-white/30"
          />
        </div>
        <button onClick={expandAll} className="text-[10px] text-white/30 hover:text-white/50 px-2">Expandir tudo</button>
        <button onClick={collapseAll} className="text-[10px] text-white/30 hover:text-white/50 px-2">Recolher</button>
      </div>

      <div className="space-y-1">
        {filteredTree.map((cat) => {
          const isOpen = expanded.has(cat.key) || search.trim().length > 0;
          const { total, checked } = categoryCheckedCount(cat);
          const allChecked = checked === total;
          const someChecked = checked > 0 && checked < total;

          return (
            <div key={cat.key} className="glass-card rounded-lg overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggle(cat.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
              >
                <ChevronRight className={cn("h-3.5 w-3.5 text-white/30 transition-transform", isOpen && "rotate-90")} />
                <span className="text-sm font-semibold flex-1">{cat.label}</span>
                <span className="text-[10px] text-white/20 font-mono mr-2">{checked}/{total}</span>
                {!readOnly && (
                  <Checkbox
                    checked={allChecked}
                    // @ts-ignore
                    indeterminate={someChecked}
                    onCheckedChange={(v) => { toggleCategoryAll(cat, !!v); }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5"
                  />
                )}
              </button>

              {/* Subcategories */}
              {isOpen && (
                <div className="border-t border-white/[0.04]">
                  {cat.subcategories.map((sub) => (
                    <div key={sub.key} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                      <span className="text-xs text-white/70 min-w-[180px]">{sub.label}</span>
                      <div className="flex items-center gap-3 flex-wrap flex-1">
                        {sub.actions.map((act) => {
                          const key = permKey(sub.key, act);
                          const isChecked = !!permissions[key];
                          return (
                            <label
                              key={act}
                              className={cn(
                                "flex items-center gap-1.5 text-[11px] cursor-pointer select-none transition-colors",
                                readOnly && "pointer-events-none",
                                isChecked ? "text-white/70" : "text-white/25"
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(v) => handleCheck(sub.key, act, !!v)}
                                disabled={readOnly}
                                className="h-3.5 w-3.5"
                              />
                              {actionLabels[act]}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
