import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RegistryColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

export interface RegistryItem {
  id: string;
  name: string;
  status?: "ativo" | "inativo";
  [key: string]: any;
}

interface RegistryTableProps {
  title: string;
  description?: string;
  columns: RegistryColumn[];
  data: RegistryItem[];
  onAdd: () => void;
  onEdit: (item: RegistryItem) => void;
  onDelete: (item: RegistryItem) => void;
  onToggleStatus?: (item: RegistryItem) => void;
}

export function RegistryTable({
  title,
  description,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatus,
}: RegistryTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => data.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-heading font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>}
        </div>
        <Button
          onClick={onAdd}
          className="gradient-primary border-0 text-white font-semibold gap-2 rounded-full px-5 text-sm"
        >
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/[0.05] border-border rounded-xl h-9 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`text-left p-3.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider ${col.className || ""}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="p-3.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-muted-foreground/50 text-sm">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`p-3.5 ${col.className || ""}`}>
                        {col.render ? col.render(item[col.key], item) : item[col.key]}
                      </td>
                    ))}
                    <td className="p-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-popover border-border text-foreground min-w-[140px]"
                        >
                          <DropdownMenuItem
                            onClick={() => onEdit(item)}
                            className="gap-2 text-sm cursor-pointer focus:bg-white/[0.06] focus:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </DropdownMenuItem>
                          {onToggleStatus && (
                            <DropdownMenuItem
                              onClick={() => onToggleStatus(item)}
                              className="gap-2 text-sm cursor-pointer focus:bg-white/[0.06] focus:text-foreground"
                            >
                              {item.status === "ativo" ? (
                                <><ToggleLeft className="h-3.5 w-3.5" /> Desativar</>
                              ) : (
                                <><ToggleRight className="h-3.5 w-3.5" /> Ativar</>
                              )}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onDelete(item)}
                            className="gap-2 text-sm cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
